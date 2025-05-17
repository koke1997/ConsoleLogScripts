(function() {
  // Function to extract and clean LinkedIn skills
  function extractLinkedInSkills() {
    // First attempt to get skills from the page
    let skills = [];
    
    // Try to find skill elements in the DOM
    const skillElements = document.querySelectorAll('li[id^="profilePagedListComponent-"]');
    
    if (skillElements.length > 0) {
      skillElements.forEach(element => {
        try {
          // Extract skill name
          const skillNameElement = element.querySelector('.hoverable-link-text') || 
                                 element.querySelector('span[aria-hidden="true"]');
          
          if (!skillNameElement) return;
          
          let skillName = skillNameElement.textContent.trim();
          
          // Clean up duplicated skill names if needed
          if (skillName.includes(skillName.split(' ')[0] + ' ' + skillName.split(' ')[0])) {
            const parts = skillName.split(':');
            if (parts.length > 1) {
              skillName = parts[parts.length - 2].trim();
            }
          }
          
          // Look for endorsement count in visually hidden spans
          let endorsementCount = 0;
          const hiddenSpans = element.querySelectorAll('span.visually-hidden');
          
          hiddenSpans.forEach(span => {
            const text = span.textContent.trim();
            if (text.includes('endorsements')) {
              const matches = text.match(/(\d+)/);
              if (matches && matches[1]) {
                endorsementCount = parseInt(matches[1], 10);
              }
            }
          });
          
          skills.push({
            name: skillName,
            count: endorsementCount
          });
        } catch (error) {
          console.error("Error processing skill element:", error);
        }
      });
    }
    
    // If we couldn't extract skills from DOM, try parsing page text
    if (skills.length === 0) {
      const pageText = document.body.innerText;
      const lines = pageText.split('\n');
      
      lines.forEach(line => {
        if (line.includes('endorsements')) {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const lastPart = parts[parts.length - 1].trim();
            const countMatch = lastPart.match(/(\d+)\s+endorsements/);
            
            if (countMatch && countMatch[1]) {
              let skillName = '';
              if (parts.length >= 3) {
                skillName = parts[parts.length - 2].trim();
              } else {
                skillName = parts[0].trim().replace(/^\d+\.\s*/, '');
              }
              
              const endorsementCount = parseInt(countMatch[1], 10);
              
              skills.push({
                name: skillName,
                count: endorsementCount
              });
            }
          }
        }
      });
    }
    
    // Remove duplicates and clean up skill names
    const uniqueSkills = {};
    
    skills.forEach(skill => {
      let cleanName = skill.name;
      
      // Remove any line numbers or indices at the start
      cleanName = cleanName.replace(/^\d+[\s.:]*/g, '');
      
      // Clean up duplicate names if needed
      const colonParts = cleanName.split(':');
      if (colonParts.length > 1) {
        // For patterns like "SkillName:SkillName"
        if (colonParts[0].trim() === colonParts[1].trim()) {
          cleanName = colonParts[0].trim();
        }
      }
      
      // Store in unique skills object, keep highest count
      if (!uniqueSkills[cleanName] || skill.count > uniqueSkills[cleanName]) {
        uniqueSkills[cleanName] = skill.count;
      }
    });
    
    // Convert to array for sorting and display
    skills = Object.keys(uniqueSkills).map(name => ({
      name: name,
      count: uniqueSkills[name]
    }));
    
    return skills;
  }
  
  // Load skills data
  let skills = extractLinkedInSkills();
  
  // If no skills found automatically, provide option for manual entry
  if (skills.length === 0) {
    console.log("No skills found automatically. Using manual list from page.");
    
    // Look for a table in the page
    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      const tableRows = tables[0].querySelectorAll('tr');
      skills = [];
      
      tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const skillName = cells[2].textContent.trim();
          const countText = cells[3].textContent.trim();
          const count = parseInt(countText) || 0;
          
          if (skillName && !skillName.includes('name')) {
            skills.push({
              name: skillName,
              count: count
            });
          }
        }
      });
    }
  }
  
  // Create global function for updating endorsement counts
  window.updateSkillCount = function(skillIndex, newCount) {
    if (skillIndex >= 0 && skillIndex < skills.length && !isNaN(newCount)) {
      skills[skillIndex].count = parseInt(newCount, 10);
      console.log(`Updated "${skills[skillIndex].name}" to ${newCount} endorsements`);
      return true;
    } else {
      console.error("Invalid input. Please check the skill index and count.");
      return false;
    }
  };
  
  // Create global function for displaying sorted skills
  window.showSortedSkills = function() {
    // Sort skills by endorsement count (highest to lowest)
    const sortedSkills = [...skills].sort((a, b) => b.count - a.count);
    
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
  console.log("%cUse updateSkillCount(skillIndex, newCount) to update any skill counts", "font-style: italic;");
  console.log("%cExample: updateSkillCount(5, 10) to set WebAssembly to 10 endorsements", "font-style: italic;");
  console.log("%cWhen done, call showSortedSkills() to sort and display the final list", "font-style: italic;");
  
  // Display the original skills table with indices
  console.table(skills.map((skill, index) => ({
    index: index,
    skill: skill.name,
    endorsements: skill.count
  })));
  
  // Sort and return the skills immediately
  return showSortedSkills();
})();
