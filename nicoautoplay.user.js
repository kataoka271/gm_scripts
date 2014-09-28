// ==UserScript==
// @name           ニコニコ動画 自動再生(改)
// @namespace      https://github.com/kataoka271
// @include        http://www.nicovideo.jp/watch/*
// @version        1.0.0
// @description    ニコニコ動画で動画を自動再生できるようにする
// @grant          GM_log
// ==/UserScript==

(function(){

  if (!document.getElementById("nicoplayerContainerInner")) {
    //console.log("nicoautoplay.user.js: nicoplayerContainerInner is not defined");
    return;
  }

  function autoPlayInitializer() {
    function onVideoInitialized() {
      WatchApp.ns.model.player.NicoPlayerConnector.playVideo();
      //document.getElementById("videoTagContainer").scrollIntoView(true);
      //scrollBy(0, -50);
      //console.log("nicoautoplay.user.js: onVideoInitialized is called");
    }
    var timerId = window.setInterval(function () {
      try {
        WatchApp.ns.model.player.NicoPlayerConnector.playerAreaConnector.addEventListener("onVideoInitialized", onVideoInitialized);
        onVideoInitialized();
        clearInterval(timerId);
      } catch (e) {
        //console.log("nicoautoplay.user.js: " + e);
      }
    }, 2000);
  }

  var script = document.createElement("script");
  script.type = "text/javascript";
  script.textContent = autoPlayInitializer.toSource() + "autoPlayInitializer();";
  document.body.appendChild(script);

})();
