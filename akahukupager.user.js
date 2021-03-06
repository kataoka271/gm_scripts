// ==UserScript==
// @name           AkahukuPager
// @namespace      https://github.com/kataoka271
// @version        1.0.0
// @description    赤福にキーボードショートカットを追加
// @grant          GM_openInTab
// @include        http://*.2chan.net/b/res/*
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

  function absOffsetTop(element) {
    if (element) {
      return absOffsetTop(element.offsetParent) + element.offsetTop;
    }
    return 0;
  }

  function addHotKey() {
    var messages = new Array();
    var KEYCODE_I = 0x49;
    var KEYCODE_N = 0x4e;
    var KEYCODE_O = 0x4f;
    var KEYCODE_P = 0x50;
    var KEYCODE_R = 0x52;
    var KEYCODE_S = 0x53;

    function updateOffsets () {
      var nodes = XPath("//input[@type='checkbox' and @value='delete']");
      messages = new Array();
      for (var i = 0; i < nodes.length; i++) {
        var offset = absOffsetTop(nodes[i]);
        if (offset > 0) {
          var anchors = nodes[i].parentNode.getElementsByTagName('A');
          var link = "";
          for (var j = 0; j < anchors.length; j++) {
            if (/^[0-9]{5}/.test(anchors[j].textContent)) {
              link = anchors[j];
            }
          }
          messages.push({offset: offset, link: link});
        }
      }
    }

    function clickElement (element) {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
          false, false, false, false, 0, null);
      element.dispatchEvent(evt);
    }

    setTimeout(updateOffsets, 1000);

    addEventListener("keydown",
        function (e) {
          switch (e.keyCode) {
            case KEYCODE_N:
              for (var i = 0; i < messages.length; i++) {
                if (scrollY < messages[i].offset) {
                  scroll(scrollX, messages[i].offset);
                  e.preventDefault();
                  e.stopPropagation();
                  break;
                }
              }
              break;
            case KEYCODE_P:
              for (var i = messages.length - 1; i >= 0; i--) {
                if (scrollY > messages[i].offset) {
                  scroll(scrollX, messages[i].offset);
                  e.preventDefault();
                  e.stopPropagation();
                  break;
                }
              }
              break;
            case KEYCODE_O:
              for (var i = 0; i < messages.length; i++) {
                if (scrollY <= messages[i].offset) {
                  if (messages[i].link) {
                    GM_openInTab(messages[i].link.href);
                    e.preventDefault();
                    e.stopPropagation();
                  }
                  break;
                }
              }
              break;
            case KEYCODE_S:
              var button = document.getElementById("akahuku_reload_button");
              if (button) {
                clickElement(button);
                setTimeout(updateOffsets, 1000);
              }
              break;
          }
        }, false);
  }

  function makeImageView() {
    var imageList = document.getElementById("ImageList");
    if (imageList) {
      document.body.removeChild(imageList);
    } else {
      imageList = document.createElement("DIV");
      imageList.id = "ImageList";
      imageList.style.position = "absolute";
      imageList.style.top = scrollY + "px";
      imageList.style.left = "0";
      imageList.style.zIndex = "1000";
      imageList.style.backgroundColor = "black";
      imageList.style.padding = "20px";
      imageList.style.textAlign = "center";
      var nodes = XPath("//a[@href]/img");
      var re = /^http:\/\/[0-9A-Za-z]+\.2chan\.net\//;
      var html = "";
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (re.exec(node.parentNode.href)) {
          html += "<a target=\"_blank\" href=\"" + node.parentNode.href +
            "\"><img src=\"" + node.src + "\"></a>";
        }
      }
      imageList.innerHTML = html;
      document.body.appendChild(imageList);
    }
  }

  function addImageViewButton() {
    var button = document.createElement("a");
    button.innerHTML = "[I]";
    button.href = "javascript:void(0);";
    button.style.bottom = 0;
    button.style.right = 0;
    button.style.padding = "5px";
    button.style.position = "fixed";
    button.style.fontSize = "10pt";
    button.addEventListener("click", makeImageView, false);
    document.body.appendChild(button);
  }

  addHotKey();
  addImageViewButton();

})();
