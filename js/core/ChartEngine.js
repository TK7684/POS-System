/**
 * Lightweight Chart Engine for POS Dashboard
 * Optimized for mobile performance with minimal dependencies
 */

class ChartEngine {
  constructor() {
    this.charts = new Map();
    this.colors = {
      primary: '#0f766e',
      secondary: '#14b8a6',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      muted: '#64748b',
      background: '#f8fafc'
    };
  }

  /**
   * Create a line chart for trends
   */
  createLineChart(container, data, options = {}) {
    const config = {
      width: options.width || container.clientWidth || 300,
      height: options.height || 200,
      padding: options.padding || { top: 20, right: 20, bottom: 40, left: 50 },
      showGrid: options.showGrid !== false,
      showPoints: options.showPoints !== false,
      animate: options.animate !== false,
      ...options
    };

    const svg = this.createSVG(container, config.width, config.height);
    const chartArea = this.getChartArea(config);
    
    if (config.showGrid) {
      this.drawGrid(svg, chartArea, data);
    }
    
    this.drawLineChart(svg, chartArea, data, config);
    
    if (config.animate) {
      this.animateChart(svg);
    }

    return svg;
  }

  /**
   * Create a bar chart for comparisons
   */
  createBarChart(container, data, options = {}) {
    const config = {
      width: options.width || container.clientWidth || 300,
      height: options.height || 200,
      padding: options.padding || { top: 20, right: 20, bottom: 40, left: 50 },
      showGrid: options.showGrid !== false,
      animate: options.animate !== false,
      ...options
    };

    const svg = this.createSVG(container, config.width, config.height);
    const chartArea = this.getChartArea(config);
    
    if (config.showGrid) {
      this.drawGrid(svg, chartArea, data);
    }
    
    this.drawBarChart(svg, chartArea, data, config);
    
    if (config.animate) {
      this.animateChart(svg);
    }

    return svg;
  }

  /**
   * Create a donut chart for proportions
   */
  createDonutChart(container, data, options = {}) {
    const config = {
      width: options.width || container.clientWidth || 200,
      height: options.height || 200,
      innerRadius: options.innerRadius || 0.6,
      animate: options.animate !== false,
      showLabels: options.showLabels !== false,
      ...options
    };

    const svg = this.createSVG(container, config.width, config.height);
    this.drawDonutChart(svg, data, config);
    
    if (config.animate) {
      this.animateChart(svg);
    }

    return svg;
  }

  /**
   * Create SVG element
   */
  createSVG(container, width, height) {
    // Clear existing content
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    
    container.appendChild(svg);
    return svg;
  }

  /**
   * Get chart drawing area
   */
  getChartArea(config) {
    return {
      x: config.padding.left,
      y: config.padding.top,
      width: config.width - config.padding.left - config.padding.right,
      height: config.height - config.padding.top - config.padding.bottom
    };
  }

  /**
   * Draw grid lines
   */
  drawGrid(svg, chartArea, data) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'chart-grid');
    
    // Horizontal grid lines
    const maxValue = Math.max(...data.map(d => d.value || d.y || 0));
    const steps = 5;
    
    for (let i = 0; i <= steps; i++) {
      const y = chartArea.y + (chartArea.height / steps) * i;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', chartArea.x);
      line.setAttribute('y1', y);
      line.setAttribute('x2', chartArea.x + chartArea.width);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e2e8f0');
      line.setAttribute('stroke-width', '1');
      g.appendChild(line);
      
      // Y-axis labels
      if (i < steps) {
        const value = maxValue - (maxValue / steps) * i;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', chartArea.x - 10);
        text.setAttribute('y', y + 4);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', this.colors.muted);
        text.textContent = this.formatValue(value);
        g.appendChild(text);
      }
    }
    
    svg.appendChild(g);
  }

  /**
   * Draw line chart
   */
  drawLineChart(svg, chartArea, data, config) {
    if (!data || data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value || d.y || 0));
    const minValue = Math.min(...data.map(d => d.value || d.y || 0));
    const valueRange = maxValue - minValue || 1;
    
    // Create path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = '';
    
    data.forEach((point, index) => {
      const x = chartArea.x + (chartArea.width / (data.length - 1)) * index;
      const value = point.value || point.y || 0;
      const y = chartArea.y + chartArea.height - ((value - minValue) / valueRange) * chartArea.height;
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
    
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', config.color || this.colors.primary);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    
    svg.appendChild(path);
    
    // Draw points
    if (config.showPoints) {
      data.forEach((point, index) => {
        const x = chartArea.x + (chartArea.width / (data.length - 1)) * index;
        const value = point.value || point.y || 0;
        const y = chartArea.y + chartArea.height - ((value - minValue) / valueRange) * chartArea.height;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', config.color || this.colors.primary);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        
        // Add tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${point.label || point.x || index}: ${this.formatValue(value)}`;
        circle.appendChild(title);
        
        svg.appendChild(circle);
      });
    }
    
    // X-axis labels
    data.forEach((point, index) => {
      const x = chartArea.x + (chartArea.width / (data.length - 1)) * index;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', chartArea.y + chartArea.height + 20);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', this.colors.muted);
      text.textContent = point.label || point.x || index;
      svg.appendChild(text);
    });
  }

  /**
   * Draw bar chart
   */
  drawBarChart(svg, chartArea, data, config) {
    if (!data || data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value || d.y || 0));
    const barWidth = chartArea.width / data.length * 0.8;
    const barSpacing = chartArea.width / data.length * 0.2;
    
    data.forEach((point, index) => {
      const value = point.value || point.y || 0;
      const barHeight = (value / maxValue) * chartArea.height;
      const x = chartArea.x + (chartArea.width / data.length) * index + barSpacing / 2;
      const y = chartArea.y + chartArea.height - barHeight;
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', point.color || config.color || this.colors.primary);
      rect.setAttribute('rx', '4');
      
      // Add tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${point.label || point.x || index}: ${this.formatValue(value)}`;
      rect.appendChild(title);
      
      svg.appendChild(rect);
      
      // X-axis labels
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + barWidth / 2);
      text.setAttribute('y', chartArea.y + chartArea.height + 20);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', this.colors.muted);
      text.textContent = point.label || point.x || index;
      svg.appendChild(text);
    });
  }

  /**
   * Draw donut chart
   */
  drawDonutChart(svg, data, config) {
    if (!data || data.length === 0) return;

    const centerX = config.width / 2;
    const centerY = config.height / 2;
    const radius = Math.min(config.width, config.height) / 2 - 20;
    const innerRadius = radius * config.innerRadius;
    
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
    let currentAngle = -Math.PI / 2; // Start at top
    
    data.forEach((segment, index) => {
      const value = segment.value || 0;
      const angle = (value / total) * 2 * Math.PI;
      const endAngle = currentAngle + angle;
      
      // Create arc path
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      const x1 = centerX + Math.cos(currentAngle) * radius;
      const y1 = centerY + Math.sin(currentAngle) * radius;
      const x2 = centerX + Math.cos(endAngle) * radius;
      const y2 = centerY + Math.sin(endAngle) * radius;
      const x3 = centerX + Math.cos(endAngle) * innerRadius;
      const y3 = centerY + Math.sin(endAngle) * innerRadius;
      const x4 = centerX + Math.cos(currentAngle) * innerRadius;
      const y4 = centerY + Math.sin(currentAngle) * innerRadius;
      
      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', segment.color || this.getColor(index));
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '2');
      
      // Add tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${segment.label}: ${this.formatValue(value)} (${((value/total)*100).toFixed(1)}%)`;
      path.appendChild(title);
      
      svg.appendChild(path);
      
      currentAngle = endAngle;
    });
    
    // Center text
    if (config.centerText) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', centerX);
      text.setAttribute('y', centerY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '18');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', this.colors.primary);
      text.textContent = config.centerText;
      svg.appendChild(text);
    }
  }

  /**
   * Animate chart appearance
   */
  animateChart(svg) {
    const paths = svg.querySelectorAll('path');
    const rects = svg.querySelectorAll('rect');
    const circles = svg.querySelectorAll('circle');
    
    // Animate paths (lines)
    paths.forEach((path, index) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.style.animation = `drawPath 1s ease-out ${index * 0.1}s forwards`;
    });
    
    // Animate bars
    rects.forEach((rect, index) => {
      rect.style.transform = 'scaleY(0)';
      rect.style.transformOrigin = 'bottom';
      rect.style.animation = `growBar 0.8s ease-out ${index * 0.1}s forwards`;
    });
    
    // Animate points
    circles.forEach((circle, index) => {
      circle.style.transform = 'scale(0)';
      circle.style.animation = `popIn 0.5s ease-out ${0.5 + index * 0.05}s forwards`;
    });
  }

  /**
   * Get color by index
   */
  getColor(index) {
    const colorPalette = [
      this.colors.primary,
      this.colors.secondary,
      this.colors.success,
      this.colors.warning,
      this.colors.danger,
      '#8b5cf6',
      '#f59e0b',
      '#ef4444'
    ];
    return colorPalette[index % colorPalette.length];
  }

  /**
   * Format value for display
   */
  formatValue(value) {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else if (value % 1 === 0) {
      return value.toString();
    } else {
      return value.toFixed(2);
    }
  }

  /**
   * Update chart data
   */
  updateChart(container, newData, options = {}) {
    const existingSvg = container.querySelector('svg');
    if (existingSvg) {
      existingSvg.remove();
    }
    
    // Recreate chart with new data
    if (options.type === 'line') {
      return this.createLineChart(container, newData, options);
    } else if (options.type === 'bar') {
      return this.createBarChart(container, newData, options);
    } else if (options.type === 'donut') {
      return this.createDonutChart(container, newData, options);
    }
  }

  /**
   * Destroy chart and clean up
   */
  destroyChart(container) {
    container.innerHTML = '';
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes drawPath {
    to {
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes growBar {
    to {
      transform: scaleY(1);
    }
  }
  
  @keyframes popIn {
    to {
      transform: scale(1);
    }
  }
  
  .chart-container {
    position: relative;
    width: 100%;
    height: auto;
  }
  
  .chart-container svg {
    max-width: 100%;
    height: auto;
  }
  
  .chart-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    pointer-events: none;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .chart-tooltip.show {
    opacity: 1;
  }
`;

if (!document.querySelector('#chart-engine-styles')) {
  style.id = 'chart-engine-styles';
  document.head.appendChild(style);
}

export default ChartEngine;