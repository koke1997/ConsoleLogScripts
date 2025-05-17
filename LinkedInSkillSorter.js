(function() {
  // Function to clean skill names by removing duplication
  function cleanSkillName(name) {
    if (!name) return '';
    
    // Remove any duplicated name patterns
    let cleanName = name;
    
    // Pattern like "SkillNameSkillName"
    const halfLength = Math.floor(cleanName.length / 2);
    if (halfLength > 0 && cleanName.substring(0, halfLength) === cleanName.substring(halfLength, halfLength * 2)) {
      cleanName = cleanName.substring(0, halfLength);
    }
    
    // Pattern like "Name:Name"
    const parts = cleanName.split(':');
    if (parts.length >= 2 && parts[0].trim() === parts[1].trim()) {
      cleanName = parts[0].trim();
    }
    
    return cleanName.trim();
  }

  // Function to extract all skills directly from the LinkedIn profile page
  function extractSkillsFromPage() {
    const skills = [];
    
    // Direct approach: look for all skill list items with endorsement counts
    const skillItems = document.querySelectorAll('li[id^="profilePagedListComponent-"]');
    
    skillItems.forEach(item => {
      try {
        // Try to find the skill name
        const nameElement = item.querySelector('.hoverable-link-text') || 
                          item.querySelector('span[aria-hidden="true"]');
        
        if (!nameElement) return;
        
        let skillName = nameElement.textContent.trim();
        
        // Clean up the skill name
        skillName = cleanSkillName(skillName);
        
        // Find endorsement count (including hidden ones)
        let endorsementCount = 0;
        
        // Look in visually-hidden spans for endorsement counts
        const hiddenSpans = item.querySelectorAll('.visually-hidden');
        for (const span of hiddenSpans) {
          const text = span.textContent.trim();
          if (text.includes('endorsement')) {
            const matches = text.match(/(\d+)/);
            if (matches && matches[1]) {
              endorsementCount = parseInt(matches[1], 10);
              break;
            }
          }
        }
        
        // If no count found in hidden spans, try other elements
        if (endorsementCount === 0) {
          const countElements = item.querySelectorAll('span');
          for (const el of countElements) {
            const text = el.textContent.trim();
            if (text.includes('endorsement')) {
              const matches = text.match(/(\d+)/);
              if (matches && matches[1]) {
                endorsementCount = parseInt(matches[1], 10);
                break;
              }
            }
          }
        }
        
        // Add to our skills array
        skills.push({
          name: skillName,
          count: endorsementCount || 0 // Ensure we have at least 0
        });
      } catch (error) {
        console.error("Error processing skill element:", error);
      }
    });
    
    return skills;
  }
  
  // Function to extract skills from the page text when DOM structure is unavailable
  function extractSkillsFromText() {
    const text = document.body.innerText;
    const lines = text.split('\n');
    const skills = [];
    
    // RegExp to match lines with skills and endorsements
    // This should match both formats:
    // 1. SkillName: X endorsements
    // 2. index: SkillName: X endorsements
    const skillRegex = /(?:\d+:\s+)?([\w\s\(\)\-\.\,']+?):\s+(\d+)\s+endorsements?/i;
    
    for (const line of lines) {
      const match = line.match(skillRegex);
      if (match && match.length >= 3) {
        const skillName = cleanSkillName(match[1]);
        const count = parseInt(match[2], 10);
        
        // Skip entries that aren't actually skills
        if (skillName.toLowerCase().includes('index') || 
            skillName.toLowerCase().includes('rank') || 
            skillName.toLowerCase().includes('skill') ||
            skillName.toLowerCase().includes('endorsement')) {
          continue;
        }
        
        // Add to our skills array
        skills.push({
          name: skillName,
          count: count
        });
      }
    }
    
    return skills;
  }
  
  // Function to manually parse skills data from the console output
  function extractSkillsFromConsoleOutput() {
    // Get all text on the page
    const text = document.body.innerText;
    const skills = [];
    
    // Look for all lines with "endorsement" mentions
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Match specific patterns like:
      // - "4. REST APIsREST APIs: 3 endorsements"
      // - "4	4	REST APIsREST APIs	3"
      let skillName = '';
      let count = 0;
      
      if (line.includes('endorsements')) {
        // Pattern like "SkillName: X endorsements"
        const match = line.match(/(\d+\.\s+)?([\w\s\(\)\-\.\,']+?):\s+(\d+)\s+endorsements?/i);
        if (match && match.length >= 4) {
          skillName = match[2];
          count = parseInt(match[3], 10);
        }
      } else if (line.includes('\t')) {
        // Pattern like "index skill endorsements" in table output
        const parts = line.split('\t');
        if (parts.length >= 4 && !isNaN(parseInt(parts[3]))) {
          skillName = parts[2].trim();
          count = parseInt(parts[3], 10);
        }
      }
      
      if (skillName && count >= 0) {
        // Clean up the skill name
        skillName = cleanSkillName(skillName);
        
        // Skip headers or metadata
        if (skillName.toLowerCase().includes('index') || 
            skillName.toLowerCase().includes('rank') || 
            skillName.toLowerCase().includes('name') ||
            skillName.toLowerCase() === 'skill') {
          continue;
        }
        
        // Add to our skills array
        skills.push({
          name: skillName,
          count: count
        });
      }
    }
    
    return skills;
  }
  
  // Function to handle skill endorsement counts more accurately
  function parseEndorsementCounts() {
    // Try multiple methods and use the one that yields the most skills with counts
    const pageSkills = extractSkillsFromPage();
    const textSkills = extractSkillsFromText();
    const consoleSkills = extractSkillsFromConsoleOutput();
    
    // Choose the method that found the most skills
    let allMethodSkills = [pageSkills, textSkills, consoleSkills]
      .sort((a, b) => b.length - a.length)[0];
    
    // Remove duplicates and keep highest counts
    const uniqueSkills = {};
    
    allMethodSkills.forEach(skill => {
      const name = skill.name;
      
      if (!uniqueSkills[name] || skill.count > uniqueSkills[name]) {
        uniqueSkills[name] = skill.count;
      }
    });
    
    // Convert to array for sorting
    const finalSkills = Object.keys(uniqueSkills)
      .filter(name => name && name.length > 0 && name !== "undefined")
      .map(name => ({
        name: name,
        count: uniqueSkills[name]
      }));
    
    return finalSkills;
  }
  
  // Main function to extract and display skills
  function extractAndDisplaySkills() {
    // Get all skills from various methods
    let skills = parseEndorsementCounts();
    
    // Make sure we have skills data
    if (skills.length === 0) {
      console.log("No skills found. Please ensure you're on a LinkedIn profile page with skills section visible.");
      return [];
    }
    
    // Create global function for updating skill endorsement counts
    window.updateSkillCount = function(index, newCount) {
      if (index >= 0 && index < skills.length && !isNaN(newCount)) {
        skills[index].count = parseInt(newCount, 10);
        console.log(`Updated "${skills[index].name}" to ${newCount} endorsements`);
        return true;
      } else {
        console.error("Invalid input. Please check the index and count.");
        return false;
      }
    };
    
    // Create global function for displaying the sorted skills
    window.showSortedSkills = function() {
      // Sort skills by endorsement count (highest to lowest)
      const sortedSkills = [...skills].sort((a, b) => {
        // Sort by count first (descending)
        if (b.count !== a.count) return b.count - a.count;
        // If counts are the same, sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      // Format the output
      let output = "LinkedIn Skills Sorted by Endorsement Count:\n";
      output += "------------------------------------------------\n";
      
      sortedSkills.forEach((skill, index) => {
        output += `${index + 1}. ${skill.name}: ${skill.count} endorsement${skill.count !== 1 ? 's' : ''}\n`;
      });
      
      console.log(output);
      
      // Display as a table for better visualization
      console.table(sortedSkills.map((skill, index) => ({
        rank: index + 1,
        skill: skill.name,
        endorsements: skill.count
      })));
      
      return sortedSkills;
    };
    
    // Display instructions
    console.log("%cLinkedIn Skills Sorter", "font-size: 16px; font-weight: bold; color: #0077B5;");
    console.log("%cUse updateSkillCount(index, newCount) to update any skill counts", "font-style: italic;");
    console.log("%cExample: updateSkillCount(5, 10) to update a skill's endorsement count", "font-style: italic;");
    console.log("%cWhen done, call showSortedSkills() to sort and display the final list", "font-style: italic;");
    
    // Display the original skills table with indices
    console.table(skills.map((skill, index) => ({
      index: index,
      skill: skill.name,
      endorsements: skill.count
    })));
    
    // Return the sorted skills
    return showSortedSkills();
  }
  
  // Run the main function
  return extractAndDisplaySkills();
})();
