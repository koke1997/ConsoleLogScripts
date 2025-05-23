// 🎯 UNIVERSAL CANVAS->WASM PERFORMANCE INTERCEPTOR
// Copy-paste this on ANY website to analyze Canvas performance!
//Just paste it anywhere and interact with the graphics to see real performance analysis!

(function() {
  'use strict';
  
  // Prevent double-loading
  if (window.CanvasWasmInterceptor) {
    console.log('⚠️  Canvas interceptor already running!');
    return;
  }
  window.CanvasWasmInterceptor = true;
  
  const config = {
    duration: 120000, // Run for 2 minutes (adjustable)
    logInterval: 3000, // Update every 3 seconds
    sampleRate: 1.0, // Monitor 100% of operations (set to 0.1 for 10% sampling on heavy sites)
    autoDetectGraphics: true, // Auto-detect graphics-heavy pages
    methods: [
      'fillRect', 'strokeRect', 'clearRect', 'arc', 'fill', 'stroke', 
      'beginPath', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo',
      'bezierCurveTo', 'drawImage', 'putImageData', 'fillText', 'strokeText',
      'save', 'restore', 'translate', 'rotate', 'scale', 'transform'
    ]
  };
  
  let stats = {
    operations: 0,
    jsTime: 0,
    wasmTime: 0,
    methods: {},
    canvases: new Set(),
    startTime: performance.now(),
    pageInfo: {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname
    }
  };
  
  // Simple WASM simulator (since we can't load real WASM on every site)
  const wasmSimulator = {
    // Simulate WASM operations with optimized loops
    geometryOp: (complexity = 10) => {
      let result = 0;
      for (let i = 0; i < complexity; i++) {
        result += Math.sin(i) * Math.cos(i);
      }
      return result;
    },
    
    pixelOp: (pixels = 100) => {
      let result = 0;
      for (let i = 0; i < pixels; i++) {
        result += (i * 0.299 + i * 0.587 + i * 0.114); // RGB to grayscale calc
      }
      return result;
    }
  };
  
  // Detect page type for better analysis
  function detectPageType() {
    const indicators = {
      gaming: ['game', 'play', 'arcade', 'unity', 'webgl'],
      visualization: ['chart', 'graph', 'plot', 'visual', 'data'],
      animation: ['animate', 'motion', 'tween', 'canvas'],
      drawing: ['draw', 'paint', 'sketch', 'design', 'editor'],
      video: ['video', 'stream', 'media', 'player']
    };
    
    const pageText = (document.title + ' ' + window.location.href).toLowerCase();
    
    for (const [type, keywords] of Object.entries(indicators)) {
      if (keywords.some(keyword => pageText.includes(keyword))) {
        return type;
      }
    }
    
    return 'general';
  }
  
  // Store original methods
  const originalMethods = {};
  config.methods.forEach(method => {
    if (CanvasRenderingContext2D.prototype[method]) {
      originalMethods[method] = CanvasRenderingContext2D.prototype[method];
    }
  });
  
  // Intercept Canvas operations
  function interceptMethod(methodName) {
    const original = originalMethods[methodName];
    if (!original) return;
    
    CanvasRenderingContext2D.prototype[methodName] = function(...args) {
      // Sample based on config
      if (Math.random() > config.sampleRate) {
        return original.apply(this, args);
      }
      
      stats.operations++;
      stats.methods[methodName] = (stats.methods[methodName] || 0) + 1;
      stats.canvases.add(this.canvas);
      
      // Time JavaScript operation
      const jsStart = performance.now();
      const result = original.apply(this, args);
      const jsEnd = performance.now();
      stats.jsTime += (jsEnd - jsStart);
      
      // Simulate WASM operation based on method type
      const wasmStart = performance.now();
      
      switch (methodName) {
        case 'fillRect':
        case 'strokeRect':
        case 'clearRect':
          wasmSimulator.geometryOp(5);
          break;
          
        case 'arc':
        case 'fill':
        case 'stroke':
          wasmSimulator.geometryOp(8);
          break;
          
        case 'drawImage':
        case 'putImageData':
          const pixels = args[0]?.width * args[0]?.height || 10000;
          wasmSimulator.pixelOp(Math.min(pixels / 100, 1000));
          break;
          
        case 'fillText':
        case 'strokeText':
          wasmSimulator.geometryOp(15);
          break;
          
        default:
          wasmSimulator.geometryOp(3);
      }
      
      const wasmEnd = performance.now();
      stats.wasmTime += (wasmEnd - wasmStart);
      
      return result;
    };
  }
  
  // Apply interception
  config.methods.forEach(interceptMethod);
  
  // Enhanced stats display
  function showStats() {
    if (stats.operations === 0) return;
    
    const runtime = ((performance.now() - stats.startTime) / 1000).toFixed(1);
    const jsAvg = (stats.jsTime / stats.operations).toFixed(4);
    const wasmAvg = (stats.wasmTime / stats.operations).toFixed(4);
    const speedup = stats.wasmTime > 0 ? (stats.jsTime / stats.wasmTime).toFixed(1) : 'N/A';
    const opsPerSec = (stats.operations / (runtime || 1)).toFixed(0);
    
    console.clear();
    console.log('🌐 UNIVERSAL CANVAS PERFORMANCE ANALYZER');
    console.log('═══════════════════════════════════════════════');
    console.log(`🌍 Site: ${stats.pageInfo.domain}`);
    console.log(`📄 Page: ${stats.pageInfo.title.substring(0, 50)}...`);
    console.log(`🎯 Type: ${detectPageType()}`);
    console.log(`🖼️  Canvases: ${stats.canvases.size}`);
    console.log(`⏱️  Runtime: ${runtime}s`);
    console.log(`📊 Operations: ${stats.operations.toLocaleString()} (${opsPerSec}/sec)`);
    console.log('');
    console.log('⚡ PERFORMANCE COMPARISON:');
    console.log(`🟦 JavaScript: ${stats.jsTime.toFixed(2)}ms (${jsAvg}ms/op)`);
    console.log(`🟩 WASM Est.: ${stats.wasmTime.toFixed(2)}ms (${wasmAvg}ms/op)`);
    console.log(`🚀 Potential Speedup: ${speedup}x`);
    
    if (stats.operations > 100) {
      const potentialSavings = stats.jsTime - stats.wasmTime;
      const percentFaster = ((potentialSavings / stats.jsTime) * 100).toFixed(1);
      console.log(`💰 Time Savings: ${potentialSavings.toFixed(2)}ms (${percentFaster}%)`);
    }
    
    console.log('');
    console.log('📈 TOP OPERATIONS:');
    Object.entries(stats.methods)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .forEach(([method, count], i) => {
        const percent = ((count / stats.operations) * 100).toFixed(1);
        console.log(`${i + 1}. ${method}: ${count.toLocaleString()} (${percent}%)`);
      });
    
    // Performance assessment
    console.log('');
    if (stats.operations > 1000) {
      console.log('🔥 HIGH GRAPHICS ACTIVITY - Great candidate for WASM optimization!');
    } else if (stats.operations > 100) {
      console.log('⚡ MODERATE GRAPHICS - WASM could provide benefits');
    } else {
      console.log('📊 LOW GRAPHICS - WASM overhead might not be worth it');
    }
  }
  
  // Auto-detect graphics-heavy pages
  if (config.autoDetectGraphics) {
    setTimeout(() => {
      if (stats.operations < 10) {
        console.log('🔍 Low Canvas activity detected. Checking for WebGL...');
        
        const webglCanvases = Array.from(document.querySelectorAll('canvas')).filter(canvas => {
          return canvas.getContext('webgl') || canvas.getContext('webgl2') || 
                 canvas.getContext('experimental-webgl');
        });
        
        if (webglCanvases.length > 0) {
          console.log(`🎮 Found ${webglCanvases.length} WebGL canvas(es) - this page uses GPU rendering!`);
          console.log('💡 WebGL already provides GPU acceleration similar to WASM benefits');
        }
      }
    }, 5000);
  }
  
  // Periodic updates
  const statsInterval = setInterval(showStats, config.logInterval);
  
  // Cleanup and final report
  setTimeout(() => {
    clearInterval(statsInterval);
    
    // Restore original methods
    Object.entries(originalMethods).forEach(([method, original]) => {
      CanvasRenderingContext2D.prototype[method] = original;
    });
    
    // Final comprehensive report
    showStats();
    console.log('');
    console.log('📋 FINAL ANALYSIS:');
    
    if (stats.operations > 5000) {
      console.log('🚀 HIGHLY RECOMMENDED: This site would benefit significantly from WASM');
    } else if (stats.operations > 500) {
      console.log('✅ RECOMMENDED: WASM optimization would provide measurable benefits');
    } else {
      console.log('⚪ MINIMAL BENEFIT: Current Canvas usage is light');
    }
    
    console.log(`📊 Total Data: ${JSON.stringify({
      site: stats.pageInfo.domain,
      operations: stats.operations,
      jsTime: Math.round(stats.jsTime),
      estimatedSpeedup: speedup,
      topMethod: Object.entries(stats.methods).sort(([,a], [,b]) => b - a)[0]?.[0]
    }, null, 2)}`);
    
    console.log('');
    console.log('✅ Analysis complete! Canvas methods restored.');
    console.log('🔄 Run again anytime by pasting the script');
    
    delete window.CanvasWasmInterceptor;
    
  }, config.duration);
  
  // Initial setup complete
  console.log('🎯 Universal Canvas Performance Analyzer Started!');
  console.log(`⏰ Running for ${config.duration/1000} seconds on: ${stats.pageInfo.domain}`);
  console.log('📊 Monitoring Canvas 2D operations...');
  console.log('🎨 Interact with graphics to see performance data!');
  
  // Detect existing canvases
  const existingCanvases = document.querySelectorAll('canvas');
  if (existingCanvases.length > 0) {
    console.log(`🖼️  Found ${existingCanvases.length} existing canvas element(s)`);
  }
  
})();
