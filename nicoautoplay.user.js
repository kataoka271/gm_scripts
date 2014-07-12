// ==UserScript==
// @name           ニコニコ動画 自動再生(改)
// @namespace      https://github.com/kataoka271
// @include        http://www.nicovideo.jp/watch/*
// @version        1.0.0
// @description    ニコニコ動画で動画を自動再生できるようにする
// @grant          GM_log
// ==/UserScript==

(function(){

  if (document.getElementById('nicoplayerContainerInner')) {

    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.textContent = 'WatchApp.ns.init.PlayerInitializer.nicoPlayerConnector.playerAreaConnector.addEventListener("onVideoInitialized",function(){WatchApp.ns.model.player.NicoPlayerConnector.playVideo();});';
    document.body.appendChild(script);

  }

})();
