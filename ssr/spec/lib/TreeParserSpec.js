const treeParser = require('../../lib/TreeParser.js');

describe('Tree Parser', () => {
  describe('firstChildByTag', () => {
    let tree;
    let html;
    beforeEach(() => {
      tree = treeParser.parse(`<html>
            <head></head>
            <body></body>
          </html>`);
      html = tree.root.firstChild;
    });
    it('returns first child of tag', () => {
      expect(html.firstChildByTag('body').tagName).toEqual('body');
    });
    it('ignores case', () => {
      expect(html.firstChildByTag('BODY').tagName).toEqual('body');
    });
  });

  describe('nextNode', () => {
    it('walks depth-first through the dom', () => {
      const tree = treeParser.parse(`<!doctype html>
          <html>
            <head>
              <script></script>
            </head>
            <body>
              <p>Text<span>More text</span></p>
            </body>
          </html>
        `);
      const expectedNodes = [
        'root-root',
        '!doctype-directive',
        'html-tag',
        'head-tag',
        'null-text',
        'script-script',
        'null-text',
        'null-text',
        'body-tag',
        'null-text',
        'p-tag',
        'null-text',
        'span-tag',
        'null-text',
        'null-text'
      ];
      expect(traverse(tree)).toEqual(expectedNodes);
    });
  });
});

describe('Tree', () => {
  describe('appendChild', () => {
    let firstElement;
    let secondElement;
    let head;
    beforeEach(() => {
      let tree = treeParser.parse('<html><head></head></html>');
      head = tree.root.firstChild.firstChild;

      firstElement = tree.createElement('meta');
      head.appendChild(firstElement);

      secondElement = tree.createElement('script');
      head.appendChild(secondElement);
    });
    it('appends child', () => {
      expect(head.firstChild).toBe(firstElement);
    });
    it('sets previous', () => {
      expect(head.children[1].prev).toBe(firstElement);
    });
    it('sets next', () => {
      expect(head.firstChild.next).toBe(secondElement);
    });
  });
});

function traverse(tree) {
  const traversedNodes = [];
  let node = tree.root;
  while (node) {
    traversedNodes.push(node.tagName + '-' + node.type);
    node = node.nextNode();
  }
  return traversedNodes;
}
