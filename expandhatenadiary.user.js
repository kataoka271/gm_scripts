// ==UserScript==
// @name            ExpandHatenaDiary
// @namespace       https://github.com/kataoka271
// @version         1.0.0
// @description     ネストされた匿名ダイアリを展開する
// @include         http://anond.hatelabo.jp/*
// ==/UserScript==

(function () {

  var button = document.createElement("A");
  button.innerHTML = "#OPEN";
  button.href = "javascript:(function(){var as=document.getElementsByTagName('a');for(var i=0;i<as.length;i++){var a=as[i].getAttribute('onclick');if(a&&a.indexOf('toggleTBC')>=0)toggleTBContent(a.match(/\\d+/)[0]);}})()";
  button.style.fontSize = "9pt";
  button.style.position = "fixed";
  button.style.right = 0;
  button.style.bottom = 0;
  document.body.appendChild(button);

})();
