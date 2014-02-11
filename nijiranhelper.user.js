// ==UserScript==
// @name            NijiranHelper
// @namespace       https://github.com/kataoka271
// @version         1.0.0
// @description     虹覧に新着レス数を追加する
// @grant           GM_getValue
// @grant           GM_setValue
// @include         http://futaba.qs.cjb.net/nijiran/*
// @include         http://*.2chan.net/b/res/*
// ==/UserScript==

(function () {

  function XPath(query, context) {
    var results = document.evaluate(query, context || document,
      null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    var nodes = new Array();
    for (var i = 0; i < results.snapshotLength; i++) {
      nodes.push(results.snapshotItem(i));
    }
    return nodes;
  }

  function catalog() {
    if (!/^http:\/\/futaba.qs.cjb.net\/nijiran\//.test(location.href))
      return;
    if (document.title == "一時ミラーページ")
      return; 
    var nodes = XPath("//div[@class='res1']");
    var cache = eval(GM_getValue("cache", {}));
    var key = /fCatalog_(..*)\.html$/.exec(location.href)[1];
    var count = cache[key] || {};
    var hittest = {};
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var href = node.childNodes[0].href;
      var resnum = parseInt(node.childNodes[1].textContent);
      if (count[href]) {
        var diff = resnum - count[href];
        var resNew = "";
        if (diff > 0) {
          resNew = "(<span style=\"color:#ff0000\">+" + diff + "</span>)";
        } else if (diff == 0) {
          resNew = "(0)";
        } else { // diff < 0
          resNew = "(<span style=\"color:#0000ff\">" + diff + "</span>)";
        }
      } else {
        // 新着エントリ
        resNew = "(<span style=\"color:#ff0000\">NEW</span>)";
      }
      node.childNodes[1].innerHTML =
        "<span style=\"font-size:0.8em\">" + resnum + resNew + "</span>";
      // 見つかったエントリにはhittestをセットする
      count[href] = resnum;
      hittest[href] = true;
    }
    // hittest に見つからなかったエントリは前回のページ取得でキャッシュ
    // に登録されたかつ今回のページ取得で見つからなかったエントリなので
    // 削除する。
    for (var href in count) {
      if (!hittest[href]) {
        delete count[href];
      }
    }
    cache[key] = count;
    GM_setValue("cache", cache.toSource());
  }

  function message() {
    if (!/http:\/\/*.2chan.net\/b\/res\//.test(location.href))
      return;
    var cache = eval(GM_getValue("cache", {}));
    var nodes = XPath("//input[@value='delete']");
    if (cache[key]) {
      for (var i = 0; i < nodes.length; i++) {
        if (i >= cache[key]) {
          nodes[i].parentNode.style.backgroundColor = "#F0B0A6";
        }
      }
    }
    cache[key] = nodes.length;
    GM_setValue("cache", cache.toSource());
  }

  catalog();
  message();

})();
