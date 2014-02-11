// ==UserScript==
// @name            up.pandoravote.net
// @namespace       https://github.com/kataoka271
// @version         1.0.0
// @description     up.pandoravote.netで1クリックで画像を表示する
// @include         http://up.pandoravote.net/*
// ==/UserScript==

(function () {

  // up.pandoravote.net
  function replaceURL(context) {
    var xpath = ".//input[@type='button' and @value='Copy' and @onclick]";
    var nodes = document.evaluate(xpath, context, null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < nodes.snapshotLength; i++) {
      var node = nodes.snapshotItem(i);
      var attr = node.getAttribute("onclick");
      var m = /'(http:\/\/[^']+)'/.exec(attr);
      if (!m) {
        continue;
      }
      var target = node.parentNode.firstChild;
      while (target) {
        if (target.tagName == 'A' &&
          target.getAttribute("onkeypress")) {
            target.href = m[1];
          }
        target = target.nextSibling;
      }
    }
  }

  document.body.addEventListener('AutoPagerize_DOMNodeInserted',
    function (evt) {
      replaceURL(evt.target);
    }, false);

  replaceURL(document);

})();
