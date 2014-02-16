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

  var offsets = [];
  var newResTop = 0;

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
    var cache = eval(GM_getValue("cache", {}));
    var cat = /fCatalog_(..*)\.html$/.exec(location.href)[1].toUpperCase();
    var count = cache[cat] || {};
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
    cache[cat] = count;
    GM_setValue("cache", cache.toSource());
  } // }}}

  function Message(display) { // {{{
    var cache = eval(GM_getValue("cache", {}));
    var nodes = XPath("//input[@value='delete']");
    var cat = /^http:\/\/(..*)\.2chan\.net\//.exec(location.href)[1].toUpperCase();
    // i = 0 はスレ画なので使わないこと（さもないとスレ全体の背景色が
    // 変わってしまう）
    if (display && cache[cat] && cache[cat][location.href]) {
      for (var i = 1; i < nodes.length; i++) {
        if (i <= cache[cat][location.href].resRead) {
          nodes[i].parentNode.style.backgroundColor = "#FEE0D6";
        } else { // 新着
          nodes[i].parentNode.style.backgroundColor = "#FED0C6";
        }
      }
    }
    // 新着の先頭を指すようにする
    newResTop = cache[cat][location.href].resRead + 1;
    cache[cat][location.href].resRead = nodes.length - 1;
    GM_setValue("cache", cache.toSource());
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
    var nodes = XPath("//input[@value='delete']");
    offsets = [];
    for (var i = 0; i < nodes.length; i++) {
      var offset = absOffsetTop(nodes[i]);
      if (offset < 0)
        continue;
      var anchors = nodes[i].parentNode.getElementsByTagName('A');
      var anchor;
      for (var j = 0; j < anchors.length; j++) {
        if (/^[0-9]{5}/.test(anchors[j].textContent)) {
          anchor = anchors[j];
        }
      }
      if (!anchor)
        continue;
      offsets.push({ offset: offset, anchor: anchor });
    }
  } // }}}

  function onKeyDown(evt) { // {{{
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
            if (offsets[i].anchor) {
              GM_openInTab(offsets[i].anchor.href);
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
          setTimeout(updateOffsets, 1000);
        }
        break; // }}}
    }
  } // }}}

  function makeImageList() { // {{{
    var imageList = document.getElementById("ImageList");
    if (imageList) {
      document.body.removeChild(imageList);
    } else {
      imageList = document.createElement("DIV");
      imageList.id = "ImageList";
      imageList.style.position = "absolute";
      imageList.style.top = window.scrollY + "px";
      imageList.style.left = "0";
      imageList.style.backgroundColor = "black";
      imageList.style.padding = "20px";
      imageList.style.textAlign = "center";
      imageList.style.zIndex = "1000";
      var nodes = XPath("//a[@href]/img");
      var html = "";
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (/^http:\/\/..*\.2chan\.net\//.test(node.parentNode.href)) {
          html += "<a target=\"_blank\" href=\"" + node.parentNode.href +
            "\"><img src=\"" + node.src + "\"></a>";
        }
      }
      imageList.innerHTML = html;
      document.body.appendChild(imageList);
    }
  } // }}}

  function gotoNewResTop() { // {{{
    if (newResTop < offsets.length) {
      scroll(window.scrollX, offsets[newResTop].offset);
    }
  } // }}}

  function addMakeImageListButton() { // {{{
    var button = document.createElement("A");
    button.href = "javascript:void(0);";
    button.innerHTML = "■";
    button.style.position = "fixed";
    button.style.bottom = "0";
    button.style.right = "0";
    button.style.fontFamily = "sans-serif";
    button.style.fontSize = "10pt";
    button.style.padding = "5px";
    button.style.zIndex = "1001";
    button.addEventListener("click", makeImageList, false);
    document.body.appendChild(button);
  } // }}}

  function addGotoNewResTopButton() { // {{{
    var button = document.createElement("A");
    button.href = "javascript:void(0);";
    button.innerHTML = "▼";
    button.style.position = "fixed";
    button.style.bottom = "0";
    button.style.right = "1.5em";
    button.style.fontFamily = "sans-serif";
    button.style.fontSize = "10pt";
    button.style.padding = "5px";
    button.style.zIndex = "1001";
    button.addEventListener("click", gotoNewResTop, false);
    document.body.appendChild(button);
  } // }}}

  if (/^http:\/\/futaba\.qs\.cjb\.net\/nijiran\//.test(location.href) &&
      document.title != "一時ミラーページ") {
    Catalog();
  } else if (/^http:\/\/..*\.2chan\.net\/b\/res\//.test(location.href)) {
    Message(true);
    addEventListener('load', updateOffsets, false);
    addMakeImageListButton();
    addGotoNewResTopButton();
    addEventListener("keydown", onKeyDown, false);
    addEventListener("unload", Message, false);
  }

})();

// vi: foldmethod=marker
