import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

interface Slide {
  id?: number;
  title: string;
  content: string[];
  notes?: string;
  speakerNotes?: string;
  layout?: string;
  visual?: string;
}

interface ExportRequest {
  slides: Slide[];
  title: string;
  style?: string;
  theme?: 'light' | 'dark' | 'gradient' | 'professional' | 'creative' | 'minimal' | 'bold' | 'tech' | 'nature';
}

// Theme colors for presentations
const themeColors: Record<string, { bg: string; text: string; accent: string; secondary: string }> = {
  light: { bg: '#FFFFFF', text: '#1a1a1a', accent: '#3b82f6', secondary: '#f3f4f6' },
  dark: { bg: '#0f172a', text: '#f8fafc', accent: '#60a5fa', secondary: '#1e293b' },
  gradient: { bg: '#667eea', text: '#ffffff', accent: '#fbbf24', secondary: '#764ba2' },
  professional: { bg: '#1a365d', text: '#ffffff', accent: '#63b3ed', secondary: '#2b6cb0' },
  creative: { bg: '#9f7aea', text: '#ffffff', accent: '#f687b3', secondary: '#ed64a6' },
  minimal: { bg: '#ffffff', text: '#1a202c', accent: '#718096', secondary: '#e2e8f0' },
  bold: { bg: '#e53e3e', text: '#ffffff', accent: '#ecc94b', secondary: '#ed8936' },
  tech: { bg: '#0d9488', text: '#ffffff', accent: '#22d3ee', secondary: '#06b6d4' },
  nature: { bg: '#276749', text: '#ffffff', accent: '#9ae6b4', secondary: '#48bb78' }
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate Office Open XML (PPTX) format
function generatePptxXml(slides: Slide[], title: string, theme: string): { [key: string]: string } {
  const colors = themeColors[theme] || themeColors.dark;
  const bgHex = colors.bg.replace('#', '');
  const textHex = colors.text.replace('#', '');
  const accentHex = colors.accent.replace('#', '');
  
  // Content Types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
${slides.map((_, i) => `  <Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n')}
</Types>`;

  // Root relationships
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  // Presentation relationships
  const presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${slides.map((_, i) => `  <Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('\n')}
  <Relationship Id="rId${slides.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;

  // Presentation
  const presentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
${slides.map((_, i) => `    <p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('\n')}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  // Theme
  const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Nairi Theme">
  <a:themeElements>
    <a:clrScheme name="Nairi">
      <a:dk1><a:srgbClr val="${textHex}"/></a:dk1>
      <a:lt1><a:srgbClr val="${bgHex}"/></a:lt1>
      <a:dk2><a:srgbClr val="${textHex}"/></a:dk2>
      <a:lt2><a:srgbClr val="${bgHex}"/></a:lt2>
      <a:accent1><a:srgbClr val="${accentHex}"/></a:accent1>
      <a:accent2><a:srgbClr val="${accentHex}"/></a:accent2>
      <a:accent3><a:srgbClr val="${accentHex}"/></a:accent3>
      <a:accent4><a:srgbClr val="${accentHex}"/></a:accent4>
      <a:accent5><a:srgbClr val="${accentHex}"/></a:accent5>
      <a:accent6><a:srgbClr val="${accentHex}"/></a:accent6>
      <a:hlink><a:srgbClr val="${accentHex}"/></a:hlink>
      <a:folHlink><a:srgbClr val="${accentHex}"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Nairi"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Nairi"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`;

  // Slide Master
  const slideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${bgHex}"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

  const slideMasterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

  const slideLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;

  const slideLayoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  const coreProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>Nairi AI</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`;

  const appProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Nairi AI</Application>
  <Slides>${slides.length}</Slides>
  <Company>Nairi</Company>
</Properties>`;

  const files: { [key: string]: string } = {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rootRels,
    'ppt/_rels/presentation.xml.rels': presRels,
    'ppt/presentation.xml': presentation,
    'ppt/theme/theme1.xml': themeXml,
    'ppt/slideMasters/slideMaster1.xml': slideMaster,
    'ppt/slideMasters/_rels/slideMaster1.xml.rels': slideMasterRels,
    'ppt/slideLayouts/slideLayout1.xml': slideLayout,
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels': slideLayoutRels,
    'docProps/core.xml': coreProps,
    'docProps/app.xml': appProps
  };

  // Generate slides
  slides.forEach((slideData, index) => {
    const slideNum = index + 1;
    const isTitleSlide = slideData.layout === 'title' || index === 0;
    
    let contentXml = '';
    if (slideData.content && slideData.content.length > 0) {
      if (isTitleSlide) {
        contentXml = `<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-US" sz="2000"><a:solidFill><a:srgbClr val="${textHex}"/></a:solidFill></a:rPr><a:t>${escapeXml(slideData.content.join(' - '))}</a:t></a:r></a:p>`;
      } else {
        contentXml = slideData.content.map(item => 
          `<a:p><a:pPr marL="457200"><a:buChar char="*"/></a:pPr><a:r><a:rPr lang="en-US" sz="1800"><a:solidFill><a:srgbClr val="${textHex}"/></a:solidFill></a:rPr><a:t>${escapeXml(item)}</a:t></a:r></a:p>`
        ).join('');
      }
    }

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="${bgHex}"/></a:solidFill></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="457200" y="${isTitleSlide ? '2286000' : '457200'}"/><a:ext cx="8229600" cy="${isTitleSlide ? '1371600' : '685800'}"/></a:xfrm>
          <a:prstGeom prst="rect"/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:pPr algn="${isTitleSlide ? 'ctr' : 'l'}"/><a:r><a:rPr lang="en-US" sz="${isTitleSlide ? '4400' : '3200'}" b="1"><a:solidFill><a:srgbClr val="${accentHex}"/></a:solidFill></a:rPr><a:t>${escapeXml(slideData.title)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="457200" y="${isTitleSlide ? '3657600' : '1371600'}"/><a:ext cx="8229600" cy="${isTitleSlide ? '914400' : '4114800'}"/></a:xfrm>
          <a:prstGeom prst="rect"/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          ${contentXml}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    files[`ppt/slides/slide${slideNum}.xml`] = slideXml;
    
    const slideRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
    files[`ppt/slides/_rels/slide${slideNum}.xml.rels`] = slideRels;
  });

  return files;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { slides, title, theme = 'dark' } = body;

    if (!slides || slides.length === 0) {
      return NextResponse.json({ error: 'No slides provided' }, { status: 400 });
    }

    // Generate PPTX XML files
    const pptxFiles = generatePptxXml(slides, title, theme);
    
    // Use JSZip to create the PPTX file (PPTX is just a ZIP with XML files)
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add all files to the ZIP
    for (const [path, content] of Object.entries(pptxFiles)) {
      zip.file(path, content);
    }
    
    // Generate the ZIP file
    const pptxBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    return new NextResponse(pptxBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pptx"`,
        'Content-Length': pptxBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('PPTX export error:', error);
    return NextResponse.json(
      { error: 'Failed to export presentation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'PPTX Export API Active',
    description: 'Export presentations to PowerPoint format using native OOXML',
    supportedFormats: ['pptx'],
    features: [
      'Full PowerPoint compatibility',
      'Custom themes and colors',
      'Professional layouts',
      'No external dependencies - uses JSZip only'
    ]
  });
}
