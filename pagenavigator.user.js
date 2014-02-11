// ==UserScript==
// @name            PageNavigator
// @namespace       https://github.com/kataoka271
// @version         1.0.0
// @description     「次へ」と「前へ」を検出してキーボードで移動できるようにする
// @exclude         https://*.live.com/*
// ==/UserScript==

(function () {

  function XPath(query) {
    var results = document.evaluate(query, document, null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    var nodes = new Array();
    for (var i = 0; i < results.snapshotLength; i++) {
      nodes.push(results.snapshotItem(i));
    }
    return nodes;
  }

  function Hint(caption, element) {
    this.caption = caption;
    this.element = element;
  }

  function findHint(regexp) {
    nodes = XPath("//a[@href]");
    for (var i = 0; i < nodes.length; i++) {
      if (regexp.test(nodes[i].textContent)) {
        return new Hint(nodes[i].textContent, nodes[i]);
      }
    }
    nodes = XPath("//a[@href]//img[@src or @alt]");
    for (var i = 0; i < nodes.length; i++) {
      if (regexp.test(nodes[i].alt) || regexp.test(nodes[i].src)) {
        var node = nodes[i];
        while (node.tagName != 'A') {
          node = node.parentNode;
        }
        return new Hint(nodes[i].alt || nodes[i].src, node);
      }
    }
    nodes = XPath("//input[@value]");
    for (var i = 0; i < nodes.length; i++) {
      if (regexp.test(nodes[i].value)) {
        return new Hint(nodes[i].value, nodes[i]);
      }
    }
  }

  function findNextHint() {
    var nodes = XPath("//link[@rel='next']");
    for (var i = 0; i < nodes.length; i++) {
      return new Hint('next', nodes[i]);
    }
    return findHint(/^\s*>*\s*(?:\u6b21\u3078|\u6b21\u306e|\u6b21\u30da\u30fc\u30b8|next)/i);
  }

  function findPrevHint() {
    var nodes = XPath("//link[@rel='prev' or @rel='previous']");
    for (var i = 0; i < nodes.length; i++) {
      return new Hint('prev', nodes[i]);
    }
    return findHint(/^\s*<*\s*(?:\u524d\u3078|\u524d\u306e|\u524d\u30da\u30fc\u30b8|prev)/i) || findHint(/^\s*<*\s*(?:back|\uff1c\u524d\u306e)/i);
  }

  function addPrevHotkey(prev) {
    window.addEventListener('keypress', function (evt) {
      var target = evt.target.tagName;
      if (target == 'INPUT' || target == 'TEXTAREA') {
        return;
      }
      if ((window.scrollY <= 0 && evt.shiftKey && evt.charCode == 0x20)
        || evt.charCode == 0x70) {
          if (prev.click) {
            prev.click();
          } else {
            window.location = prev.href;
          }
        }
    }, true);
  }

  function addNextHotKey(next) {
    window.addEventListener('keypress', function (evt) {
      var target = evt.target.tagName;
      if (target == 'INPUT' || target == 'TEXTAREA') {
        return;
      }
      if ((window.scrollY >= window.scrollMaxY && !evt.shiftKey && evt.charCode == 0x20)
        || evt.charCode == 0x6e) {
          if (next.click) {
            next.click();
          } else {
            window.location = next.href;
          }
        }
    }, true);
  }

  function makeAnchorFromHint(hint) {
    var caption = hint.caption;
    var element = hint.element;
    if (caption) {
      caption = caption.replace(/^\s+/, '');
      caption = caption.replace(/\s+$/, '');
    }
    if (element.href) {
      return '<a href="' + element.href + '">' + caption + '</a>';
    }
    return caption;
  }

  function addLinkElement(rel, href) {
    var head = document.getElementsByTagName('HEAD')[0];
    var link = document.createElement('LINK');
    link.rel = rel;
    link.href = href;
    head.appendChild(link);
  }

  function addGlobalStyle(css) {
    var head = document.getElementsByTagName('HEAD')[0];
    var style = document.createElement('STYLE');
    style.innerHTML = css;
    head.appendChild(style);
  }

  function main() {
    var next = findNextHint();
    var prev = findPrevHint();
    if (!prev && !next) {
      return;
    }
    if (prev) {
      addPrevHotkey(prev.element);
      addLinkElement('prev', prev.element);
    }
    if (next) {
      addNextHotKey(next.element);
      addLinkElement('next', next.element);
    }
    var caption = '';
    if (prev) {
      caption += '<div class="P">P: ' + makeAnchorFromHint(prev) + '</div>';
    }
    if (next) {
      caption += '<div class="N">N: ' + makeAnchorFromHint(next) + '</div>';
    }
    var div = document.createElement('div');
    div.innerHTML = caption;
    with (div.style) {
      position = 'fixed';
      zIndex = '9';
      padding = '0';
      margin = '0';
      backgroundColor = '#E0F3B2';
      color = '#18362F';
      fontWeight = 'bold';
      fontSize = '9pt';
      textAlign = 'left';
      border = '3px double #BDDB88';
      right = '0';
      bottom = '0';
      width = 'auto';
      display = 'inline';
    }
    for (var i = 0; i < div.childNodes.length; i++) {
      with (div.childNodes[i].style) {
        display = 'inline';
        width = 'auto';
        margin = '0 5px';
      }
    }
    div.addEventListener('dblclick', function () {
      div.style.visibility = 'hidden';
    }, true);
    document.body.appendChild(div);
  }

  main();

})();
