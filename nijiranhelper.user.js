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
    var nodes = [];
    for (var i = 0; i < results.snapshotLength; i++) {
      nodes.push(results.snapshotItem(i));
    }
    return nodes;
  }

  function catalog() {
    var nodes = XPath("//div[@class='res1']");
    var cache = eval(GM_getValue("cache", {}));
    var key = /fCatalog_(..*)\.html$/.exec(location.href)[1].toUpperCase();
    var count = cache[key] || {};
    var hittest = {};
    var href = "";
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.childNodes.length < 2)
        continue;
      href = node.childNodes[0].href;
      if (!count[href]) {
        count[href] = { resNum: 0, resRead: 0 };
      }
      var resNum = parseInt(node.childNodes[1].textContent || "0");
      var resNew = "";
      var resDiff = 0;
      if (count[href].resNum) {
        resDiff = resNum - count[href].resNum;
        if (resDiff > 0) {
          resNew += "<span style=\"color:#ff0000\">+" + resDiff + "</span>";
        } else if (resDiff === 0) {
          resNew += "0";
        } else { // resDiff < 0
          resNew += "<span style=\"color:#0000ff\">" + resDiff + "</span>";
        }
      } else {
        // 新着エントリ
        resNew += "-";
      }
      if (count[href].resRead) {
        resDiff = resNum - count[href].resRead;
        if (resDiff > 0) {
          resNew += "/<span style=\"color:#ff0000\">+" + resDiff + "</span>";
        } else if (resDiff === 0) {
          resNew += "/0";
        } else { // resDiff < 0
          resNew += "/<span style=\"color:#0000ff\">" + resDiff + "</span>";
        }
        node.style.backgroundColor = "#ffccbb";
      } else {
        resNew += "/-";
      }
      node.childNodes[1].innerHTML =
        "" + resNum + "<br><span style=\"font-size:8pt\">" + resNew + "</span>";
      // 見つかったエントリにはhittestをセットする
      count[href].resNum = resNum;
      hittest[href] = true;
    }
    // hittest に見つからなかったエントリは前回のページ取得でキャッシュ
    // に登録されたかつ今回のページ取得で見つからなかったエントリなので
    // 削除する。
    for (href in count) {
      if (!hittest[href]) {
        delete count[href];
      }
    }
    cache[key] = count;
    GM_setValue("cache", cache.toSource());
  }

  function message() {
    var cache = eval(GM_getValue("cache", {}));
    var nodes = XPath("//input[@value='delete']");
    var key = /^http:\/\/(..*)\.2chan\.net\//.exec(location.href)[1].toUpperCase();
    // i = 0 はスレ画なので使わないこと（さもないとスレ全体の背景色が変わってしまう）
    if (cache[key] && cache[key][location.href]) {
      for (var i = 1; i < nodes.length; i++) {
        if (i <= cache[key][location.href].resRead) {
          nodes[i].parentNode.style.backgroundColor = "#FEE0D6";
        } else {
          nodes[i].parentNode.style.backgroundColor = "#FED0C6";
        }
      }
    }
    cache[key][location.href].resRead = nodes.length - 1;
    GM_setValue("cache", cache.toSource());
  }

  if (/^http:\/\/futaba\.qs\.cjb\.net\/nijiran\//.test(location.href) &&
      document.title != "一時ミラーページ") {
    catalog();
  } else if (/^http:\/\/..*\.2chan\.net\/b\/res\//.test(location.href)) {
    message();
  }

})();
