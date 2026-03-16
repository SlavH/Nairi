import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

// Data Visualization / Chart Generation API
// Generates charts, graphs, and infographics from data

interface ChartRequest {
  type: "bar" | "line" | "pie" | "scatter" | "area" | "radar" | "heatmap" | "treemap" | "funnel" | "gauge"
  data: any // Chart data
  title?: string
  subtitle?: string
  theme?: "light" | "dark" | "colorful" | "minimal"
  width?: number
  height?: number
  options?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`chart:${clientId}`, { maxRequests: 30, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many chart requests.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: ChartRequest = await request.json()
    const { 
      type, 
      data, 
      title, 
      subtitle,
      theme = "light",
      width = 800,
      height = 600,
      options = {}
    } = body

    if (!type) {
      return NextResponse.json({ error: "Chart type is required" }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: "Data is required" }, { status: 400 })
    }

    const validTypes = ["bar", "line", "pie", "scatter", "area", "radar", "heatmap", "treemap", "funnel", "gauge"]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid chart type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 })
    }

    // Generate chart configuration for client-side rendering
    // This returns a configuration that can be used with Chart.js, ECharts, or similar
    
    const chartConfig = generateChartConfig(type, data, title, subtitle, theme, options)
    
    // Also generate a QuickChart URL for instant image
    const quickChartUrl = generateQuickChartUrl(type, data, title, width, height, theme)

    return NextResponse.json({
      success: true,
      chart: {
        type,
        config: chartConfig,
        imageUrl: quickChartUrl,
        width,
        height,
        theme
      },
      message: "✅ Chart configuration generated successfully"
    })

  } catch (error) {
    console.error("[CHART] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Chart generation failed" },
      { status: 500 }
    )
  }
}

function generateChartConfig(
  type: string, 
  data: any, 
  title?: string, 
  subtitle?: string,
  theme?: string,
  options?: Record<string, any>
) {
  const colors = theme === "dark" 
    ? ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#F87171']
    : ['#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444']

  const baseConfig: any = {
    type,
    data: {
      labels: data.labels || [],
      datasets: Array.isArray(data.datasets) ? data.datasets.map((ds: any, i: number) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || colors[i % colors.length],
        borderColor: ds.borderColor || colors[i % colors.length]
      })) : [{
        data: data.values || data,
        backgroundColor: colors,
        borderColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: !!title,
          text: title || '',
          font: { size: 18 }
        },
        subtitle: {
          display: !!subtitle,
          text: subtitle || ''
        },
        legend: {
          position: 'bottom'
        }
      },
      ...options
    }
  }

  // Type-specific configurations
  switch (type) {
    case 'pie':
    case 'doughnut':
      baseConfig.options.cutout = type === 'doughnut' ? '50%' : 0
      break
    case 'radar':
      baseConfig.options.scales = {
        r: {
          beginAtZero: true
        }
      }
      break
    case 'scatter':
      baseConfig.options.scales = {
        x: { type: 'linear', position: 'bottom' },
        y: { type: 'linear' }
      }
      break
  }

  return baseConfig
}

function generateQuickChartUrl(
  type: string,
  data: any,
  title?: string,
  width?: number,
  height?: number,
  theme?: string
) {
  // QuickChart.io provides free chart image generation
  const chartConfig = {
    type: type === 'area' ? 'line' : type,
    data: {
      labels: data.labels || [],
      datasets: Array.isArray(data.datasets) ? data.datasets : [{
        label: data.label || 'Data',
        data: data.values || data
      }]
    },
    options: {
      title: {
        display: !!title,
        text: title
      },
      plugins: {
        legend: { display: true }
      }
    }
  }

  if (type === 'area') {
    chartConfig.data.datasets = chartConfig.data.datasets.map((ds: any) => ({
      ...ds,
      fill: true
    }))
  }

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig))
  const bgColor = theme === 'dark' ? '1f2937' : 'ffffff'
  
  return `https://quickchart.io/chart?c=${encodedConfig}&w=${width || 800}&h=${height || 600}&bkg=%23${bgColor}`
}

export async function GET() {
  return NextResponse.json({
    name: "Data Visualization API",
    description: "Generate charts and graphs from data",
    chartTypes: [
      { id: "bar", label: "Bar Chart", description: "Compare values across categories" },
      { id: "line", label: "Line Chart", description: "Show trends over time" },
      { id: "pie", label: "Pie Chart", description: "Show proportions of a whole" },
      { id: "scatter", label: "Scatter Plot", description: "Show correlation between variables" },
      { id: "area", label: "Area Chart", description: "Show cumulative values over time" },
      { id: "radar", label: "Radar Chart", description: "Compare multiple variables" },
      { id: "heatmap", label: "Heatmap", description: "Show density or intensity" },
      { id: "treemap", label: "Treemap", description: "Show hierarchical data" },
      { id: "funnel", label: "Funnel Chart", description: "Show stages in a process" },
      { id: "gauge", label: "Gauge Chart", description: "Show progress toward a goal" }
    ],
    themes: [
      { id: "light", label: "Light" },
      { id: "dark", label: "Dark" },
      { id: "colorful", label: "Colorful" },
      { id: "minimal", label: "Minimal" }
    ],
    dataFormat: {
      simple: {
        example: { labels: ["A", "B", "C"], values: [10, 20, 30] }
      },
      datasets: {
        example: {
          labels: ["Jan", "Feb", "Mar"],
          datasets: [
            { label: "Sales", data: [100, 150, 200] },
            { label: "Expenses", data: [80, 90, 120] }
          ]
        }
      }
    }
  })
}
