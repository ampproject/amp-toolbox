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
  });

  describe('hasAttribute', () => {
    let node;
    beforeEach(() => {
      const tree = treeParser.parse('<html></html>');
      node = tree.root.firstChild;
    });
    it('false if no attribute with name', () => {
      expect(node.hasAttribute('unknown')).toBe(false);
    });
    it('true if attribute with name', () => {
      node.attribs.amp = 'there';
      expect(node.hasAttribute('amp')).toBe(true);
    });
    it('true if empty attribute', () => {
      node.attribs.amp = '';
      expect(node.hasAttribute('amp')).toBe(true);
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
  let tree = treeParser.parse('<html><head></head></html>');
  describe('createElement', () => {
    it('works without attributes', () => {
      const element = tree.createElement('test');
      expect(element.tagName).toBe('test');
    });
    it('works with attributes', () => {
      const element = tree.createElement('test', {myAttribute: 'hello'});
      expect(element.attribs.myAttribute).toBe('hello');
    });
  });
  describe('createTextNode', () => {
    it('sets data', () => {
      const textNode = tree.createTextNode('test');
      expect(textNode.data).toBe('test');
    });
  });
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
