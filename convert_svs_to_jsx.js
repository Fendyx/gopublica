const fs = require('fs');

function svgToJsx(svgContent, componentName) {
  let jsx = svgContent;
  
  // Remove XML declaration
  jsx = jsx.replace(/<\?xml[^?]*\?>/g, '');
  // Remove DOCTYPE
  jsx = jsx.replace(/<!DOCTYPE[^>]*>/g, '');
  // Remove HTML entity declarations
  jsx = jsx.replace(/<!ENTITY[^>]*>/g, '');
  // Remove metadata
  jsx = jsx.replace(/<metadata[\s\S]*?<\/metadata>/g, '');
  // Remove sodipodi:namedview
  jsx = jsx.replace(/<sodipodi:namedview[\s\S]*?<\/sodipodi:namedview>/g, '');
  jsx = jsx.replace(/<sodipodi:namedview[^/]*\/>/g, '');
  // Remove inkscape attributes
  jsx = jsx.replace(/\s*inkscape:[^=]*="[^"]*"/g, '');
  // Remove sodipodi attributes
  jsx = jsx.replace(/\s*sodipodi:[^=]*="[^"]*"/g, '');
  // Remove xmlns:xlink (handled by JSX)
  jsx = jsx.replace(/\s*xmlns:xlink="[^"]*"/g, '');
  // Remove xmlns:dc, xmlns:cc, xmlns:rdf, xmlns:svg, etc
  jsx = jsx.replace(/\s*xmlns:[a-z]+="[^"]*"/g, '');
  // Remove xml:space
  jsx = jsx.replace(/\s*xml:space="[^"]*"/g, '');
  
  // Convert xlink:href to just href
  jsx = jsx.replace(/xlink:href/g, 'href');
  
  // Convert attribute names to camelCase
  jsx = jsx.replace(/fill-rule/g, 'fillRule');
  jsx = jsx.replace(/clip-rule/g, 'clipRule');
  jsx = jsx.replace(/stroke-width/g, 'strokeWidth');
  jsx = jsx.replace(/stroke-linecap/g, 'strokeLinecap');
  jsx = jsx.replace(/stroke-linejoin/g, 'strokeLinejoin');
  jsx = jsx.replace(/stroke-dasharray/g, 'strokeDasharray');
  jsx = jsx.replace(/stroke-dashoffset/g, 'strokeDashoffset');
  jsx = jsx.replace(/stroke-miterlimit/g, 'strokeMiterlimit');
  jsx = jsx.replace(/font-size/g, 'fontSize');
  jsx = jsx.replace(/font-family/g, 'fontFamily');
  jsx = jsx.replace(/font-weight/g, 'fontWeight');
  jsx = jsx.replace(/text-anchor/g, 'textAnchor');
  jsx = jsx.replace(/dominant-baseline/g, 'dominantBaseline');
  jsx = jsx.replace(/letter-spacing/g, 'letterSpacing');
  jsx = jsx.replace(/stop-color/g, 'stopColor');
  jsx = jsx.replace(/stop-opacity/g, 'stopOpacity');
  jsx = jsx.replace(/flood-opacity/g, 'floodOpacity');
  jsx = jsx.replace(/flood-color/g, 'floodColor');
  jsx = jsx.replace(/gradient-units/g, 'gradientUnits');
  jsx = jsx.replace(/pattern-units/g, 'patternUnits');
  jsx = jsx.replace(/pattern-content-units/g, 'patternContentUnits');
  jsx = jsx.replace(/preserve-aspect-ratio/g, 'preserveAspectRatio');
  jsx = jsx.replace(/clip-path/g, 'clipPath');
  jsx = jsx.replace(/fill-opacity/g, 'fillOpacity');
  jsx = jsx.replace(/background-image/g, 'backgroundImage');
  
  // Remove style attributes with complex CSS (convert to inline)
  // Remove <style> blocks
  jsx = jsx.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  
  // Remove comments
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove <switch> and </switch>
  jsx = jsx.replace(/<switch>/g, '');
  jsx = jsx.replace(/<\/switch>/g, '');
  
  // Remove <foreignObject> blocks
  jsx = jsx.replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, '');
  
  // Remove empty <g> with i:extraneous="self" attribute
  jsx = jsx.replace(/<g\s+i:extraneous="self">/g, '<g>');
  
  // Remove i: and graph: attributes
  jsx = jsx.replace(/\s*i:[a-z-]+="[^"]*"/g, '');
  jsx = jsx.replace(/\s*graph:[a-z-]+="[^"]*"/g, '');
  
  // Remove enabledBackground (not valid in React)
  jsx = jsx.replace(/\s*enable-background="[^"]*"/g, '');
  
  // Remove version attribute
  jsx = jsx.replace(/\s*version="[^"]*"/g, '');
  
  // Clean up extra whitespace/newlines
  jsx = jsx.replace(/\n\s*\n\s*\n/g, '\n');
  
  return jsx.trim();
}

// Process each SVG file
const files = {
  'Apple_Pay_logo.svg': 'LogoApplePay',
  'Google_Pay_Logo.svg': 'LogoGooglePay',
  'visa.svg': 'LogoVisa',
  'blik.svg': 'LogoBlik',
  'inpost_logo.svg': 'LogoInPost',
  'dpd_logo.svg': 'LogoDPD',
  'fedex_logo.svg': 'LogoFedEx',
  'GLS_Logo.svg': 'LogoGLS',
  'Orlen_paczka_logo.svg': 'LogoOrlenPaczka',
  'poczta_polska_logo.svg': 'LogoPocztaPolska',
  'ups_logo.svg': 'LogoUPS'
};

for (const [file, name] of Object.entries(files)) {
  const content = fs.readFileSync('temp_logos/' + file, 'utf8');
  const jsx = svgToJsx(content, name);
  
  console.log('\n// ============ ' + name + ' (from ' + file + ') ============');
  console.log('function ' + name + '({ className }: { className?: string }) {');
  console.log('  return (');
  // Indent each line of the JSX
  const lines = jsx.split('\n');
  for (const line of lines) {
    console.log('    ' + line);
  }
  console.log('  );');
  console.log('}');
  console.log('\n');
}
