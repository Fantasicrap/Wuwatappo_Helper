export const helperPhrolovaCss = `
§{
 --wt-ui-text:#54243a;--wt-ui-muted:#6f4055;--wt-ui-border:#cb99ac;--wt-ui-divider:#dfb8c5;
 --wt-ui-field:#f9e8ef;--wt-ui-card-fill:#fbedf3db;--wt-ui-surface:#f8e7ee;--wt-ui-hover:#efd5e1;
 --wt-ui-rail:#4b263a;--wt-ui-accent:#ad4c73;--wt-ui-accent-fill:#e7adc7;--wt-ui-focus:#873751;--wt-ui-decor:#c97999;
 --wt-ui-raster:grayscale(1) brightness(.9) sepia(.36) saturate(2.9) hue-rotate(289deg);
 --wt-synthesis-border:#ca789c;--wt-synthesis-bubble:linear-gradient(145deg,#fff4f7,#efd1e0);
 --wt-synthesis-text:#662946;--wt-synthesis-shadow:#62233c33;
 --wt-tide-count-bg:#f8e7ee;--wt-tide-count-text:#732144;
 --wt-tide-spark:#e67c9d;--wt-tide-spark-light:#ffcfbd;
}
§ .module-panel{background-color:#4b263a;border-color:#673650;box-shadow:0 4px #54263e}
§ .tab-bar{
 background-image:linear-gradient(180deg,#3416249c,#4b2336c5),
 var(--wt-custom-background,var(--wt-theme-bg,radial-gradient(ellipse at 65% 32%,#ac536d,#51263b 70%)));
 background-size:cover;background-position:82% center;background-repeat:no-repeat;
 border-radius:42px 0 0 42px;
}
§ .module-content{background:#a6658377;border-color:#97536f}
§ .module-content__bg{
 background-color:#703e56;border-color:#a35e78;
 background-image:linear-gradient(100deg,#f6e6ee69,#eac2d42b 65%,#7c3b5952),
 var(--wt-custom-background,var(--wt-theme-bg,radial-gradient(ellipse at 76% 41%,#ce889a,#6c314d 65%,#392336)));
 background-size:cover;background-position:62% center
}
§[data-wt-custom-background] .module-content__bg{background-position:center}
§ .module-content__bg::before,§ .module-content__bg::after{opacity:.18;filter:var(--wt-ui-raster)}
§ .tab-btn__label{color:#fff4f8;text-shadow:0 1px 3px #250d1b}
§ .tab-btn:hover:not(:last-of-type){background:#70405a}
§ .tab-btn--active:not(:last-of-type){background:#f1dce6!important;border-color:#bd7597;box-shadow:0 3px #a65377}
§ .tab-btn--active:not(:last-of-type) .tab-btn__label{color:#6b2448;text-shadow:none}
§ .tab-btn__icon{filter:var(--wt-ui-raster)}
§ .setting-item,§ .wt-ui-card,§ .wt-ui-feature,§ .wt-ui-room-tools{background:var(--wt-ui-card-fill);border-color:var(--wt-ui-border)}
§ .wt-ui-card--primary{background:#f4dbe8ed;border-color:#c98ba6}
§ .wt-ui-button--primary,§ .wt-ui-button[aria-pressed=true]{background:#d48eaa;border-color:#b86b89;color:#501d38}
§ .wt-theme-option{background:#fdf3f8;border-color:var(--wt-ui-border);color:var(--wt-ui-text)}
§ .wt-theme-option[aria-pressed=true]{border-color:#b35c7d;box-shadow:0 0 0 3px #b35c7d45}
§ .wt-theme-option[aria-pressed=true] b:after{background:#ebbbce}
§ .wt-theme-import output{
 width:fit-content;padding:3px 7px;border-radius:7px;background:#f9e8efeb;color:#54243a
}
§ input[type=checkbox],§ input[type=radio]{accent-color:#ac4c73}
§ .pet-info .text{background:#fae8ef;color:#7a2349}
§ .pet-toolbar{filter:var(--wt-ui-raster)}
§[data-wt-phrolova-toolbar] .pet-toolbar{background-image:var(--wt-phrolova-toolbar);filter:none}
§ .wt-input-bubble{background:linear-gradient(155deg,#fcf0f7,#ecc5d8);color:#712a4e;border-color:#af6388;box-shadow:0 3px 7px #733e602b}
§ .wt-input-bubble::after{border-color:#af6388}
§ .wt-phrolova-speech{border-color:#b87b9a!important;box-shadow:0 2px 9px #70284430!important}
§ .wt-keyboard-plate:after{background:#ead1df;border-color:#b887a6}
§ .wt-pad-board #wt-pad-body stop:first-child{stop-color:#f8ecf2}
§ .wt-pad-board #wt-pad-body stop:last-child{stop-color:#dcb3ce}
§ .wt-pad-board #wt-pad-grip stop:first-child{stop-color:#f0d8e6}
§ .wt-pad-board #wt-pad-grip stop:last-child{stop-color:#c892b4}
§ .about-root,§ .oss-notice-root,§ .app-update-overlay__panel,§ .role-switch-emote-overlay__panel{background-image:linear-gradient(140deg,#fff2f7,#eac7d9)}
`.split('§').join(':root[data-wt-theme="phrolova"]');
