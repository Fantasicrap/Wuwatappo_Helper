using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;

static class PayloadDelta
{
    static readonly byte[] Magic = Encoding.ASCII.GetBytes("WTDP0001");
    const int BufferSize = 81920;

    internal sealed class Header
    {
        public long BaseLength;
        public byte[] BaseSha256;
        public long TargetLength;
        public byte[] TargetSha256;
        public int SegmentCount;
    }

    static void ReadExact(Stream stream, byte[] buffer, int offset, int count)
    {
        int readTotal = 0;
        while (readTotal < count)
        {
            int n = stream.Read(buffer, offset + readTotal, count - readTotal);
            if (n <= 0) throw new InvalidDataException("Unexpected end of payload delta stream.");
            readTotal += n;
        }
    }

    internal static Header ReadHeader(Stream delta)
    {
        var head = new byte[92];
        ReadExact(delta, head, 0, head.Length);
        for (int i = 0; i < Magic.Length; i++)
            if (head[i] != Magic[i]) throw new InvalidDataException("Invalid payload delta header.");
        long baseLen = BitConverter.ToInt64(head, 8);
        var baseHash = new byte[32];
        Buffer.BlockCopy(head, 16, baseHash, 0, 32);
        long targetLen = BitConverter.ToInt64(head, 48);
        var targetHash = new byte[32];
        Buffer.BlockCopy(head, 56, targetHash, 0, 32);
        int count = BitConverter.ToInt32(head, 88);
        if (baseLen < 0 || targetLen < 0 || count < 0)
            throw new InvalidDataException("Invalid payload delta metadata.");
        return new Header
        {
            BaseLength = baseLen,
            BaseSha256 = baseHash,
            TargetLength = targetLen,
            TargetSha256 = targetHash,
            SegmentCount = count
        };
    }

    static bool FileMatches(string path, long expectedLength, byte[] expectedSha256)
    {
        if (!File.Exists(path) || new FileInfo(path).Length != expectedLength) return false;
        using (var sha = SHA256.Create())
        using (var existing = File.OpenRead(path))
            return sha.ComputeHash(existing).SequenceEqual(expectedSha256);
    }

    static void CopyAndHash(Stream input, Stream output, long count, byte[] buffer, SHA256 hashA, SHA256 hashB)
    {
        long remaining = count;
        while (remaining > 0)
        {
            int toRead = (int)Math.Min(buffer.Length, remaining);
            int n = input.Read(buffer, 0, toRead);
            if (n <= 0) throw new InvalidDataException("Unexpected end of stream during payload reconstruction.");
            if (hashA != null) hashA.TransformBlock(buffer, 0, n, null, 0);
            if (hashB != null) hashB.TransformBlock(buffer, 0, n, null, 0);
            if (output != null) output.Write(buffer, 0, n);
            remaining -= n;
        }
    }

    internal static byte[] ApplyStream(Stream baseStream, Stream deltaStream, Stream output)
    {
        var header = ReadHeader(deltaStream);
        if (baseStream.Length != header.BaseLength)
            throw new InvalidDataException("Base payload length mismatch.");
        var buffer = new byte[BufferSize];
        var segHead = new byte[12];
        using (var baseSha = SHA256.Create())
        using (var targetSha = SHA256.Create())
        {
            long pos = 0;
            for (int i = 0; i < header.SegmentCount; i++)
            {
                ReadExact(deltaStream, segHead, 0, 12);
                long offset = BitConverter.ToInt64(segHead, 0);
                int length = BitConverter.ToInt32(segHead, 8);
                if (offset < pos || length <= 0 || offset > header.TargetLength - length)
                    throw new InvalidDataException("Invalid payload delta segment bounds.");

                if (offset > pos)
                {
                    if (offset > header.BaseLength)
                        throw new InvalidDataException("Delta references bytes beyond base payload.");
                    CopyAndHash(baseStream, output, offset - pos, buffer, baseSha, targetSha);
                    pos = offset;
                }

                long baseOverlap = Math.Min(length, Math.Max(0, header.BaseLength - pos));
                if (baseOverlap > 0)
                    CopyAndHash(baseStream, null, baseOverlap, buffer, baseSha, null);

                CopyAndHash(deltaStream, output, length, buffer, targetSha, null);
                pos += length;
            }

            if (pos < header.TargetLength)
            {
                if (header.TargetLength > header.BaseLength)
                    throw new InvalidDataException("Delta did not cover bytes beyond base payload.");
                CopyAndHash(baseStream, output, header.TargetLength - pos, buffer, baseSha, targetSha);
                pos = header.TargetLength;
            }

            if (pos < header.BaseLength)
                CopyAndHash(baseStream, null, header.BaseLength - pos, buffer, baseSha, null);

            if (deltaStream.ReadByte() != -1)
                throw new InvalidDataException("Unexpected trailing bytes in payload delta.");

            baseSha.TransformFinalBlock(new byte[0], 0, 0);
            targetSha.TransformFinalBlock(new byte[0], 0, 0);
            if (!baseSha.Hash.SequenceEqual(header.BaseSha256))
                throw new InvalidDataException("Base payload SHA-256 verification failed.");
            if (!targetSha.Hash.SequenceEqual(header.TargetSha256))
                throw new InvalidDataException("Reconstructed payload SHA-256 verification failed.");
            return (byte[])targetSha.Hash.Clone();
        }
    }

    internal static bool MatchesBase(Assembly assembly, string deltaResource, string path)
    {
        using (var deltaStream = assembly.GetManifestResourceStream(deltaResource))
        {
            if (deltaStream == null) return false;
            var header = ReadHeader(deltaStream);
            return FileMatches(path, header.BaseLength, header.BaseSha256);
        }
    }

    internal static string Extract(Assembly assembly, string baseResource, string deltaResource, string folder, string filename)
    {
        string path = Path.Combine(folder, filename);
        using (var deltaStream = assembly.GetManifestResourceStream(deltaResource))
        {
            if (deltaStream == null) throw new InvalidOperationException("Missing embedded resource: " + deltaResource);
            var header = ReadHeader(deltaStream);
            if (FileMatches(path, header.TargetLength, header.TargetSha256)) return path;
            deltaStream.Position = 0;
            using (var baseStream = assembly.GetManifestResourceStream(baseResource))
            {
                if (baseStream == null) throw new InvalidOperationException("Missing embedded resource: " + baseResource);
                string temp = path + "." + Process.GetCurrentProcess().Id + ".tmp";
                try
                {
                    using (var target = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None))
                        ApplyStream(baseStream, deltaStream, target);
                    if (File.Exists(path)) File.Delete(path);
                    File.Move(temp, path);
                    return path;
                }
                finally { if (File.Exists(temp)) File.Delete(temp); }
            }
        }
    }
}
