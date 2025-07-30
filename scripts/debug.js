// Debug script for troubleshooting
console.log('=== nodove Blog Debug Information ===');

// 1. Check if all scripts are loaded
setTimeout(() => {
    console.log('1. Script Loading Check:');
    console.log('  - MarkdownParser:', typeof MarkdownParser !== 'undefined' ? '✅' : '❌');
    console.log('  - Router:', typeof Router !== 'undefined' ? '✅' : '❌');
    console.log('  - window.markdownParser:', window.markdownParser ? '✅' : '❌');
    console.log('  - window.router:', window.router ? '✅' : '❌');
    
    // 2. Check markdown parser state
    if (window.markdownParser) {
        console.log('2. MarkdownParser State:');
        console.log('  - Posts loaded:', window.markdownParser.posts.length);
        console.log('  - Is loaded:', window.markdownParser.isLoaded);
        console.log('  - Categories:', window.markdownParser.categories.size);
        console.log('  - Tags:', window.markdownParser.tags.size);
        
        if (window.markdownParser.posts.length > 0) {
            console.log('  - First post:', window.markdownParser.posts[0]);
        }
    }
    
    // 3. Check DOM elements
    console.log('3. DOM Elements Check:');
    console.log('  - recent-posts-grid:', document.getElementById('recent-posts-grid') ? '✅' : '❌');
    console.log('  - posts-grid:', document.getElementById('posts-grid') ? '✅' : '❌');
    console.log('  - search-input:', document.getElementById('search-input') ? '✅' : '❌');
    
    // 4. Try to load data manually
    console.log('4. Manual Data Load Test:');
    fetch('/data/posts.json')
        .then(response => {
            console.log('  - JSON fetch status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('  - JSON data length:', data.length);
            console.log('  - First JSON post:', data[0]);
        })
        .catch(error => {
            console.log('  - JSON fetch error:', error.message);
        });
        
}, 2000); // 2초 후 실행