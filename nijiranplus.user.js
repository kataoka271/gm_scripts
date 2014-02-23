// ==UserScript==
// @name            虹覧plus
// @namespace       https://github.com/kataoka271
// @version         1.0.0
// @description     虹覧に既読管理機能を追加する
// @grant           GM_openInTab
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_log
// @include         http://*.2chan.net/b/res/*
// @include         http://futaba.qs.cjb.net/nijiran/*
// ==/UserScript==

/* == 注意事項

 * cache に格納されている値はカタログの値をベースとしており、
   スレについたレス数を示す。
   一方、offsets の長さはスレの全投稿数分あり、スレについた
   レス数 + 1 である。
 * cache の値は offsets の index としてそのまま使える。
 * 虹覧のカタログ更新頻度から既読からの差分が負になることがある。

*/

(function () {

  //var KEYCODE_I = 0x49;
  var KEYCODE_N = 0x4e;
  var KEYCODE_O = 0x4f;
  var KEYCODE_P = 0x50;
  //var KEYCODE_R = 0x52;
  var KEYCODE_S = 0x53;
  var CACHE_LIFETIME = 1000 * 60 * 60 * 24; // a day

  var offsets = [];
  var newResTop = 0;
  var msgCSS = "#ImageList { padding:20px; background-color:#000; text-align:center; z-index:100; } #ImageList a { border:1px solid #ccc; margin:2px; display:inline-block; position:relative; } #ImageList a img { vertical-align:top; } #ImageList a .new { position:absolute; top:0; right:0; font-family:sans-serif; font-size:8pt; background-color:#f00; color:#fff; opacity:0.6; z-index:200; }"; 
  var catCSS = "#CacheList table { font-size:9pt; margin:0 auto; } #CacheList td { padding:2px 5px; }";

  function XPath(query) { // {{{
    var results = document.evaluate(query, document, null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    var nodes = [];
    for (var i = 0; i < results.snapshotLength; i++) {
      nodes.push(results.snapshotItem(i));
    }
    return nodes;
  } // }}}

  function Catalog() { // {{{
    var nodes = XPath("//div[@class='res1']");
    var cache = JSON.parse(GM_getValue("cache", "{}")) || {};
    var cat = /fCatalog_(..*)\.html$/.exec(location.href)[1].toUpperCase();
    var entries = cache[cat] || {};
    var hittest = {};
    var href = "";
    var now = new Date().getTime();
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.childNodes.length < 2) {
        continue;
      }
      href = node.childNodes[0].href;
      if (!entries[href]) {
        entries[href] = { resNum: 0, resRead: 0, expire: 0 };
      }
      addResNew(node, entries[href]);
      entries[href].expire = now + CACHE_LIFETIME;
      // 見つかったエントリにはhittestをセットする
      hittest[href] = true;
    }
    // hittest に見つからなかったエントリは前回のページ取得でキャッシュ
    // に登録されたかつ今回のページ取得で見つからなかったエントリなので
    // 削除する。
    for (href in entries) {
      if (!hittest[href]) {
        delete entries[href];
      }
    }
    cache[cat] = entries;
    cleanCache(cache);
    GM_setValue("cache", JSON.stringify(cache));
  } // }}}

  function addResNew(node, entry) { // {{{
    var resNum = parseInt(node.childNodes[1].textContent || "0");
    var resNew = "";
    var resDiff = 0;
    if (entry.resNum) { // カタログ差分
      resDiff = resNum - entry.resNum;
      if (resDiff > 0) {
        resNew += '<span style="color:#ff0000">+' + resDiff + '</span>';
      } else if (resDiff === 0) {
        resNew += "0";
      } else { // resDiff < 0
        resNew += '<span style="color:#0000ff">' + resDiff + '</span>';
      }
    } else {
      // 新着エントリ
      resNew += "-";
    }
    if (entry.resRead) { // 既読差分
      resDiff = resNum - entry.resRead;
      if (resDiff > 0) {
        resNew += '/<span style="color:#ff0000">+' + resDiff + '</span>';
      } else if (resDiff === 0) {
        resNew += "/0";
      } else { // resDiff < 0
        resNew += '/<span style="color:#0000ff">' + resDiff + '</span>';
      }
      node.style.backgroundColor = "#ffccbb";
    } else {
      resNew += "/-";
    }
    if (node.lastChild.style.className == "resNew") {
      node.lastChild.innerHTML = resNew;
    } else {
      var info = document.createElement("div");
      info.style.className = "resNew";
      info.style.fontSize = "8pt";
      info.style.clear = "both";
      info.style.textAlign = "right";
      info.innerHTML = resNew;
      node.appendChild(info);
    }
    entry.resNum = resNum;
  } // }}}

  function onKeyDownInCat(evt) { // {{{
    switch (evt.keyCode) {
      case KEYCODE_S:
        unsafeWindow.reload_check();
        setTimeout(Catalog, 1000);
        break;
    }
  } // }}}

  function showCacheList() { // {{{
    var cacheList = document.getElementById("CacheList");
    if (cacheList) {
      document.body.removeChild(cacheList);
    } else {
      var cache = JSON.parse(GM_getValue("cache", "{}")) || {};
      var page = "";
      for (var cat in cache) {
        page += "<table>";
        page += "<caption>" + cat + "</caption>";
        page += "<tr><td>Name</td><td>ResNum</td><td>ResRead</td><td>Expire</td></tr>";
        for (var href in cache[cat]) {
          page += "<tr><td>" +
              '<a href="' + href + '">' +
              href.replace(/^..*\//, "") +
              "</a></td><td>" +
            cache[cat][href].resNum + "</td><td>" +
            cache[cat][href].resRead + "</td><td>" +
            new Date(cache[cat][href].expire).toLocaleString() + "</td></tr>";
        }
        page += "</table>";
      }
      cacheList = document.createElement("div");
      cacheList.id = "CacheList";
      cacheList.innerHTML = page;
      document.body.appendChild(cacheList);
    }
  } // }}}

  function clearCache() { // {{{
    GM_setValue("cache", "{}");
  } // }}}

  function cleanCache(cache) { // {{{
    var now = new Date().getTime();
    // 有効期限切れキャッシュの削除
    for (var cat in cache) {
      var isEmpty = true;
      for (var href in cache[cat]) {
        if (cache[cat][href].expire < now) {
          delete cache[cat][href];
        } else {
          isEmpty = false;
        }
      }
      if (isEmpty) {
        delete cache[cat];
      }
    }
  } // }}}

  function addCacheBar() { // {{{
    var bar = document.createElement("div");
    var a;
    bar.style.textAlign = "right";
    bar.style.fontFamily = "sans-serif";
    bar.style.fontSize = "8pt";
    a = document.createElement("a");
    a.href = "javascript:void(0);";
    a.innerHTML = "[Show]";
    a.addEventListener("click", showCacheList, false);
    bar.appendChild(a);
    bar.appendChild(document.createTextNode(" "));
    a = document.createElement("a");
    a.href = "javascript:void(0);";
    a.innerHTML = "[Clear]";
    a.addEventListener("click", clearCache, false);
    bar.appendChild(a);
    document.body.appendChild(bar);
  } // }}}

  function Message(highlight) { // {{{
    var cache = JSON.parse(GM_getValue("cache", "{}")) || {};
    var nodes = XPath("//input[@value='delete']/..");
    var cat = /^http:\/\/(..*)\.2chan\.net\//.exec(location.href)[1].toUpperCase();
    // i = 0 はスレ画なので使わないこと（さもないとスレ全体の背景色が
    // 変わってしまう）
    if (highlight && cache[cat] && cache[cat][location.href]) {
      for (var i = 1; i < nodes.length; i++) {
        if (i <= cache[cat][location.href].resRead) {
          nodes[i].style.backgroundColor = "#FEE0D6";
        } else { // 新着
          nodes[i].style.backgroundColor = "#FED0C6";
        }
      }
    }
    // 新着の先頭を指すようにする
    newResTop = cache[cat][location.href].resRead + 1;
    cache[cat][location.href].resRead = nodes.length - 1;
    GM_setValue("cache", JSON.stringify(cache));
  } // }}}

  function absOffsetTop(element) { // {{{
    if (element) {
      return absOffsetTop(element.offsetParent) + element.offsetTop;
    }
    return 0;
  } // }}}

  function clickElement(element) { // {{{
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
        false, false, false, false, 0, null);
    element.dispatchEvent(evt);
  } // }}}

  function updateOffsets() { // {{{
    var nodes = XPath("//input[@value='delete']/..");
    offsets = [];
    for (var i = 0; i < nodes.length; i++) {
      var offset = { offset: absOffsetTop(nodes[i]) };
      if (offset.offset == 0) {
        continue; // 削除された記事は offset = 0 となる
      }
      try {
        offset.link = nodes[i].getElementsByTagName("IMG")[0].parentNode.href;
      } catch (e) {}
      offsets.push(offset);
    }
  } // }}}

  function onKeyDownInRes(evt) { // {{{
    var i = 0;
    switch (evt.keyCode) {
      case KEYCODE_N: // {{{
        for (i = 0; i < offsets.length; i++) {
          if (window.scrollY < offsets[i].offset) {
            scroll(window.scrollX, offsets[i].offset);
            evt.preventDefault();
            evt.stopPropagation();
            break;
          }
        }
        break; // }}}
      case KEYCODE_P: // {{{
        for (i = offsets.length - 1; i >= 0; i--) {
          if (window.scrollY > offsets[i].offset) {
            scroll(window.scrollX, offsets[i].offset);
            evt.preventDefault();
            evt.stopPropagation();
            break;
          }
        }
        break; // }}}
      case KEYCODE_O: // {{{
        for (i = 0; i < offsets.length; i++) {
          if (window.scrollY <= offsets[i].offset) {
            if (offsets[i].link) {
              GM_openInTab(offsets[i].link);
              evt.preventDefault();
              evt.stopPropagation();
            }
            break;
          }
        }
        break; // }}}
      case KEYCODE_S: // {{{
        var button = document.getElementById("akahuku_reload_button");
        if (button) {
          clickElement(button);
          setTimeout(function () {
            updateOffsets();
            Message(true);
          }, 1000);
        }
        break; // }}}
    }
  } // }}}

  function makeImageList(newest) { // {{{
    var imageList = document.getElementById("ImageList");
    if (imageList) {
      document.body.removeChild(imageList);
    } else {
      imageList = document.createElement("div");
      imageList.id = "ImageList";
      imageList.style.position = "absolute";
      imageList.style.top = window.scrollY + "px";
      imageList.style.left = "0";
      var nodes = XPath("//input[@value='delete']/..");
      var page = "";
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i].getElementsByTagName("IMG")[0];
        if (!node) {
          continue;
        }
        var href = node.parentNode.href;
        var src = node.src;
        if (!/^http:\/\/..*\.2chan\.net\//.test(href)) {
          continue;
        }
        if (i >= newResTop) {
          page += '<a href="' + href + '" target="_blank"><img src="' + src + '"><span class="new">NEW</span></a>';
        } else if (!newest) {
          page += '<a href="' + href + '" target="_blank"><img src="' + src + '"></a>';
        }
      }
      imageList.innerHTML = page;
      document.body.appendChild(imageList);
    }
  } // }}}

  function gotoNewResTop() { // {{{
    if (newResTop < offsets.length) {
      scroll(window.scrollX, offsets[newResTop].offset);
    }
  } // }}}

  function addButton(label, right, func) { // {{{
    var button = document.createElement("a");
    button.href = "javascript:void(0);";
    button.innerHTML = label;
    button.style.position = "fixed";
    button.style.bottom = "0";
    button.style.right = right;
    button.style.fontFamily = "sans-serif";
    button.style.fontSize = "10pt";
    button.style.padding = "5px";
    button.style.zIndex = "200";
    button.addEventListener("click", func, false);
    document.body.appendChild(button);
  } // }}}

  function addGlobalStyle(css) { // {{{
    var head, style;
    head = document.getElementsByTagName("head")[0];
    if (!head) {
      return;
    }
    style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = css;
    head.appendChild(style);
  } // }}}

  function main() { // {{{
    if (/^http:\/\/futaba\.qs\.cjb\.net\/nijiran\//.test(location.href) &&
        document.title != "一時ミラーページ") {
      addGlobalStyle(catCSS);
      Catalog();
      addCacheBar();
      addEventListener("keydown", onKeyDownInCat, false);
    } else if (/^http:\/\/..*\.2chan\.net\/b\/res\//.test(location.href)) {
      addGlobalStyle(msgCSS);
      Message(true);
      addButton("■", "0", function () { makeImageList(false); });
      addButton("★", "1.5em", function () { makeImageList(true); });
      addButton("▼", "3.0em", gotoNewResTop);
      addEventListener("keydown", onKeyDownInRes, false);
      // レイアウト確定後でなければ正しくオフセットを計算できない
      addEventListener("load", updateOffsets, false);
      addEventListener("unload", Message, false);
    }
  } // }}}

  main();

})();

// vi: foldmethod=marker ts=2 et sw=2
