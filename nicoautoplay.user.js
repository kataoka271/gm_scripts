// ==UserScript==
// @name           ニコニコ動画 自動再生(改)
// @namespace      https://github.com/kataoka271
// @include        http://www.nicovideo.jp/watch/*
// @version        1.0.0
// @description    ニコニコ動画で動画を自動再生できるようにする
// ==/UserScript==

(function(){

  if(document.getElementById('nicoplayerContainerInner')){
    var w = unsafeWindow;
    var f = w.WatchApp.ns.model.player.NicoPlayerConnector.onVideoInitialized;
    w.WatchApp.ns.model.player.NicoPlayerConnector.onVideoInitialized = function () {
      f.apply(this, arguments);
      w.WatchApp.namespace.model.player.NicoPlayerConnector.playVideo();
    };
  }

})();
