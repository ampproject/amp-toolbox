class ServerSideRendering {
  transform(document) {
    const html = document.childNodes[0];
    html.attrs.push({name: 'i-amphtml-no-boilerplate', value: ''});    
  }
}

module.exports = ServerSideRendering;