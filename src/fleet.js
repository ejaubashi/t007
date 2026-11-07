export const FLEET = [
  {id:'fs45',code:'FS–45',name:'Origin',type:'Stealth spacecraft',accent:0xef344b,cssAccent:'#ef344b',image:'fleet-fs45.png',description:'A sculpted delta wing, a recessed glass canopy, and a quiet red signature. The craft that started the fleet.',role:'STEALTH',drive:'TWIN ION',feature:'DELTA WING'},
  {id:'asterion',code:'VX–02',name:'Asterion',type:'Ring-drive explorer',accent:0x56dce8,cssAccent:'#56dce8',image:'fleet-asterion.png',description:'A pearl ceramic fuselage suspended inside a titanium drive ring. Designed for the long way home.',role:'EXPLORATION',drive:'ANNULAR FIELD',feature:'CERAMIC HULL'},
  {id:'spectre',code:'XR–07',name:'Spectre',type:'Twin-hull interceptor',accent:0xb18aff,cssAccent:'#b18aff',image:'fleet-spectre.png',description:'Two swept forward hulls, an open central channel, and a low glass cockpit. Precision with a violet edge.',role:'INTERCEPTION',drive:'DUAL VECTOR',feature:'SPLIT HULL'},
];
export const getCraft = id => FLEET.find(craft=>craft.id===id) || FLEET[0];
export const craftPath = id => `/fleet/${getCraft(id).id}/`;
export const craftFromPath = path => getCraft(path.split('/')[2]);
