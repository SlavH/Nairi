import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { slides } = await request.json();

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Invalid slides data' },
        { status: 400 }
      );
    }

    // Generate image prompts for each slide
    const slidesWithImages = await Promise.all(
      slides.map(async (slide: any, index: number) => {
        // Skip title slide (first slide)
        if (index === 0) {
          return { ...slide, imageUrl: null };
        }

        // Generate image prompt based on slide content
        const imagePrompt = generateImagePrompt(slide.title, slide.content);
        
        // For now, use placeholder images from Unsplash
        // In production, this would call an AI image generation API
        const imageUrl = await getRelevantImage(imagePrompt);

        return {
          ...slide,
          imageUrl,
          imagePrompt
        };
      })
    );

    return NextResponse.json({ slides: slidesWithImages });
  } catch (error) {
    console.error('Error generating slide images:', error);
    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    );
  }
}

function generateImagePrompt(title: string, content: string[]): string {
  // Create a concise image prompt from slide title and content
  const contentText = content.join(' ');
  const keywords = extractKeywords(title + ' ' + contentText);
  return keywords.slice(0, 5).join(' ');
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction (remove common words)
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10);
}

async function getRelevantImage(prompt: string): Promise<string> {
  // Use Unsplash API for relevant images
  // In production, replace with AI image generation (DALL-E, Midjourney, Stable Diffusion)
  const query = encodeURIComponent(prompt);
  
  try {
    // Using Unsplash Source API for demo purposes
    // This provides random images based on keywords
    return `https://source.unsplash.com/800x600/?${query}`;
  } catch (error) {
    // Fallback to a generic business image
    return 'https://source.unsplash.com/800x600/?business,professional';
  }
}
