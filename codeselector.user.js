// ==UserScript==
// @name            CodeSelector
// @namespace       https://github.com/kataoka271
// @version         1.0.0
// @description     PREタグに囲まれたテキストをダブルクリックで一括選択する
// ==/UserScript==

(function () {

  function setSelection (elem) {
    var r = document.createRange();
    r.selectNode(elem);
    window.getSelection().addRange(r);
  }

  var elems = document.getElementsByTagName("PRE");
  for (var i = 0; i < elems.length; i++) {
    let elem = elems[i];
    elem.addEventListener("dblclick", function () {
      setSelection(elem);
    }, false);
  }

})();
