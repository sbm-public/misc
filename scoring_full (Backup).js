

window.custom = function() {
  pending_delete = 0
  let criteriaCount = 0
  let enableLogging = true; // Set to false to disable
  
  findCriteria();
  const originalLog = console.log;
  console.log = function(...args) {
      if (enableLogging) {
          originalLog.apply(console, args);
      }
  };  

  gatherVariables();

  const penalties = {
    "Dealbreaker": -10,
    "Essential": -5,
    "Valuable": -3,
    "Nice to Have": 0
  }

  class Criterion {
    constructor(penalty = null, reward = null, weight=null) {
      this.penalty = penalty;
      this.reward = reward;
      this.scoreCard = {}
    }
  }

  class Criteria {
    constructor(maxScore = null, minScore = null) {
      this.maxScore = maxScore;
      this.minScore = minScore;
      this.criteria = [];
      this.responses = {};
      for (let i = 0; i < responses.length; i++) {
        this.responses[responses[i]] = 0
      }
    }
  }  

  class Score {
    constructor(score = null, satisfies = null) {
      this.satisfies = satisfies;
      this.score = score;
    }
  }
let Tarot = new Criteria();


function captureAttributes() {
  const captured = {
    criteria: {},
    responsePairs: {}
  };
  
  // Capture weight, impact, and reward for each criterion
  for (let criterionNum = 1; criterionNum <= criteriaCount; criterionNum++) {
    captured.criteria[criterionNum] = {
      weight: null,
      impact: null,
      reward: null
    };
    
    // Capture weight
    const weightElement = document.querySelector(`[data-criterion-${criterionNum}-weight]`);
    if (weightElement) {
      captured.criteria[criterionNum].weight = weightElement.getAttribute(`data-criterion-${criterionNum}-weight`);
    }
    
    // Capture impact
    const impactElement = document.querySelector(`[data-criterion-${criterionNum}-impact]`);
    if (impactElement) {
      captured.criteria[criterionNum].impact = impactElement.getAttribute(`data-criterion-${criterionNum}-impact`);
    }
    
    // Capture reward
    const rewardElement = document.querySelector(`[data-criterion-${criterionNum}-reward]`);
    if (rewardElement) {
      captured.criteria[criterionNum].reward = rewardElement.getAttribute(`data-criterion-${criterionNum}-reward`);
    }
  }
  
  // Capture response-criteria pairs and their values
  if (window.responses && Array.isArray(window.responses)) {
    window.responses.forEach(response => {
      captured.responsePairs[response] = {};
      
      for (let criterionNum = 1; criterionNum <= criteriaCount; criterionNum++) {
        const pairKey = `${response} Criterion ${criterionNum}`;
        const element = document.querySelector(`[data-response-criteria-pair="${pairKey}"]`);
        
        if (element) {
          captured.responsePairs[response][criterionNum] = {
            dataValue: element.getAttribute('data-value') || null
          };
        } else {
          captured.responsePairs[response][criterionNum] = {
            dataValue: null
          };
        }
      }
    });
  }
  
  console.log('Captured attributes:', captured);
  return captured;
}

function recreateAttributes(capturedData, deletedIndex = null) {
  if (!capturedData) {
    console.error('No captured data provided to recreateAttributes');
    return;
  }
  
  console.log('Recreating attributes, skipping deleted index:', deletedIndex);
  
  // Map old criterion numbers to new ones (accounting for deletion)
  const getNewCriterionNum = (oldNum) => {
    if (deletedIndex === null) {
      return oldNum;
    }
    if (oldNum < deletedIndex) {
      return oldNum;
    }
    if (oldNum === deletedIndex) {
      return null; // This criterion was deleted
    }
    return oldNum - 1; // Shift down by 1 after the deleted index
  };
  
  // Recreate weight, impact, and reward attributes
  Object.keys(capturedData.criteria).forEach(oldCriterionNum => {
    const oldNum = parseInt(oldCriterionNum);
    const newNum = getNewCriterionNum(oldNum);
    
    if (newNum === null) {
      // Skip deleted criterion
      return;
    }
    
    const criterionData = capturedData.criteria[oldCriterionNum];
    
    // Recreate weight
    if (criterionData.weight && criterionData.weight !== "null") {
      const weightFieldset = findFieldsetByText(
        `How should Criterion #${newNum} be weighted?`,
        `data-criterion-${newNum}-weight`,
        criterionData.weight
      );
      if (weightFieldset) {
        console.log(`Restored weight for criterion ${newNum}: ${criterionData.weight}`);
      }
    }
    
    // Recreate impact
    if (criterionData.impact && criterionData.impact !== "null") {
      const impactFieldset = findFieldsetByText(
        `What kind of impact would the response have on you and/or the average user if Criterion #${newNum} was satisfied?`,
        `data-criterion-${newNum}-impact`,
        criterionData.impact
      );
      if (impactFieldset) {
        console.log(`Restored impact for criterion ${newNum}: ${criterionData.impact}`);
      }
    }
    
    // Recreate reward
    if (criterionData.reward && criterionData.reward !== "null") {
      const rewardFieldset = findFieldsetByText(
        `How many points should Criterion #${newNum} be worth?`,
        `data-criterion-${newNum}-reward`,
        criterionData.reward
      );
      if (rewardFieldset) {
        console.log(`Restored reward for criterion ${newNum}: ${criterionData.reward}`);
      }
    }
  });
  
  // Recreate response-criteria pairs
  if (window.responses && Array.isArray(window.responses)) {
    window.responses.forEach(response => {
      if (!capturedData.responsePairs[response]) {
        return;
      }
      
      Object.keys(capturedData.responsePairs[response]).forEach(oldCriterionNum => {
        const oldNum = parseInt(oldCriterionNum);
        const newNum = getNewCriterionNum(oldNum);
        
        if (newNum === null) {
          // Skip deleted criterion
          return;
        }
        
        const pairData = capturedData.responsePairs[response][oldCriterionNum];
        const newPairKey = `${response} Criterion ${newNum}`;
        
        const fieldset = findFieldsetByText(
          `Does ${response} satisfy Criterion #${newNum}?`,
          "data-response-criteria-pair",
          newPairKey
        );
        
        if (fieldset && pairData.dataValue) {
          fieldset.setAttribute('data-value', pairData.dataValue);
          console.log(`Restored ${newPairKey} with value: ${pairData.dataValue}`);
        }
      });
    });
  }
  
  console.log('Attribute recreation complete');
}

// Updated deleteCriteria function that uses the new capture/recreate functions
function deleteCriteriaWithCapture() {
  // Capture current state before deletion
  const capturedState = captureAttributes();
  
  // Convert to number and get the actual index
  const indexToDelete = parseInt(pending_delete, 10);
  const arrayIndexToDelete = indexToDelete - 1;
  
  console.log('Array before deletion:', Tarot.criteria);
  
  // Verify the index is valid
  if (arrayIndexToDelete >= 0 && arrayIndexToDelete < Tarot.criteria.length) {
    // Remove the element
    Tarot.criteria.splice(arrayIndexToDelete, 1);
    
    // Update the criteriaCount to match
    criteriaCount = Tarot.criteria.length;
    console.log("just deleted criteria " + pending_delete);
    console.log('Array after deletion:', Tarot.criteria);
    console.log('New criteriaCount:', criteriaCount);
  } else {
    console.error('Invalid index:', arrayIndexToDelete, 'Array length:', Tarot.criteria.length);
  }
  
  pending_delete = 0;
  
  setTimeout(function(){
    // Re-index the buttons to match the new array
    findCriteria(); 
    redoBody();
    
    // Restore the captured attributes after DOM recreation
    setTimeout(function(){
      recreateAttributes(capturedState, indexToDelete);
      
      // Then recalculate with the restored values
      setTimeout(function(){
        recalculate();
      }, 100);
    }, 100);
  }, 150);
  
  console.log(Tarot);
}



function findCriteria() {
  let buttons = document.querySelectorAll('[data-testid="delete-button"]');
  if (buttons.length !== criteriaCount)
      console.log(`Change detected: ${criteriaCount} to ${buttons.length}`);
  criteriaCount = buttons.length;
   
  buttons.forEach((button, index) => {
      button.setAttribute('data-criteria', index + 1);
      if (button.getAttribute('data-event-set') != "true") 
      {  
        button.addEventListener('click', function(event) {
            pending_delete = parseInt(this.getAttribute('data-criteria'), 10)
            console.log("pending delete set to " + pending_delete)
            console.log(Tarot)
            // Wait for the confirm deletion button to appear
            setTimeout(() => {
                // Find the newly created confirm deletion button
                // Start from the clicked button and search nearby

                let confirmButton = document.querySelector('[aria-label="Confirm Deletion"]');
                let cancelButton = document.querySelector('[aria-label="Cancel Deletion"]');
                
                if (confirmButton && !confirmButton.hasAttribute('data-listener-added')) {
                    // Mark this button so we don't add duplicate listeners
                    confirmButton.setAttribute('data-listener-added', 'true');
                    
                    // Add the event listener
                    confirmButton.addEventListener('click', function() {
                      //deleteCriteria()  
                      deleteCriteriaWithCapture();
                    });
                    
                    console.log('Added deleteCriteria listener to confirm button');
                }
                if (cancelButton && !cancelButton.hasAttribute('data-listener-added')) {
                    // Mark this button so we don't add duplicate listeners
                    cancelButton.setAttribute('data-listener-added', 'true');
                    
                    // Add the event listener
                    cancelButton.addEventListener('click', function() {
                        findCriteria();
                    });
                    
                    console.log('Added findCriteria listener to cancel button');
                }
            }, 100); // Adjust timeout if needed based on how quickly the button appears
        }, true);
      } else {
        console.log("event already set for criteria " + index)
      }  
      button.setAttribute('data-event-set', "true");
  });
}




function deleteCriteria() {
  
  // Convert to number and get the actual index
  const indexToDelete = parseInt(pending_delete, 10) - 1;
    console.log('Array before deletion:', Tarot.criteria);
  // Verify the index is valid
  if (indexToDelete >= 0 && indexToDelete < Tarot.criteria.length) {
    // Remove the element
    Tarot.criteria.splice(indexToDelete, 1);
    
    // Update the criteriaCount to match
    criteriaCount = Tarot.criteria.length;
      console.log("just deleted criteria " + pending_delete);

    console.log('Array after deletion:', Tarot.criteria);
    console.log('New criteriaCount:', criteriaCount);
  } else {
    console.error('Invalid index:', indexToDelete, 'Array length:', Tarot.criteria.length);
  }
  
  pending_delete = 0;
  

  setTimeout(function(){
    // Re-index the buttons to match the new array
    findCriteria(); 
    redoBody();
    setTimeout(function(){
      recalculate();
    },200)

  }, 150)

  
  console.log(Tarot);
}

function updateTextarea(METADATA_ATTRIBUTE, encodedData) {
    try {
        const elementWithAttribute = document.querySelector(`[${METADATA_ATTRIBUTE}]`);
        
        if (!elementWithAttribute) {
            console.warn(`Element with attribute ${METADATA_ATTRIBUTE} not found`);
            return;
        }

        let questionContainer = elementWithAttribute.closest('[id^="question-"]');
        
        if (!questionContainer) {
            console.warn(`Parent question container not found for element with ${METADATA_ATTRIBUTE}`);
            return;
        }
        
        const targetElement = questionContainer;

        if (targetElement) {
            const label = targetElement.querySelector('label');
            if (label) {
                label.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                label.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            }
            
            targetElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            targetElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            targetElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            
            const targetTextarea = targetElement.querySelector('textarea');
            
            if (targetTextarea) {
                targetTextarea.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                targetTextarea.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                targetTextarea.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                targetTextarea.focus({ preventScroll: true });
                targetTextarea.dispatchEvent(new FocusEvent('focus', { bubbles: true, cancelable: true }));
                targetTextarea.dispatchEvent(new FocusEvent('focusin', { bubbles: true, cancelable: true }));
                
                const oldValue = targetTextarea.value;
              
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeInputValueSetter.call(targetTextarea, encodedData);
                
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: encodedData,
                    dataTransfer: null,
                    view: window
                });
                targetTextarea.dispatchEvent(inputEvent);
                
                targetTextarea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                
                targetTextarea.dispatchEvent(new KeyboardEvent('keydown', { 
                    bubbles: true, 
                    cancelable: true, 
                    key: 'a',
                    code: 'KeyA',
                    keyCode: 65
                }));
                targetTextarea.dispatchEvent(new KeyboardEvent('keypress', { 
                    bubbles: true, 
                    cancelable: true, 
                    key: 'a',
                    code: 'KeyA',
                    keyCode: 65
                }));
                targetTextarea.dispatchEvent(new KeyboardEvent('keyup', { 
                    bubbles: true, 
                    cancelable: true, 
                    key: 'a',
                    code: 'KeyA',
                    keyCode: 65
                }));
                
                targetTextarea.dispatchEvent(new CustomEvent('ngModelChange', { 
                    detail: encodedData, 
                    bubbles: true 
                }));
                targetTextarea.dispatchEvent(new CustomEvent('valueChange', { 
                    detail: encodedData, 
                    bubbles: true 
                }));
                
                if (targetTextarea.classList) {
                    targetTextarea.classList.add('ng-touched');
                    targetTextarea.classList.add('ng-dirty');
                    targetTextarea.classList.remove('ng-pristine');
                    targetTextarea.classList.remove('ng-untouched');
                }

                const parentDiv = targetTextarea.parentElement;
                if (parentDiv) {
                    const previousSiblingDiv = parentDiv.previousElementSibling;
                    if (previousSiblingDiv) {
                        previousSiblingDiv.textContent = '';
                        const textNode = document.createTextNode(encodedData);
                        previousSiblingDiv.appendChild(textNode);
                    }
                }
                
                targetTextarea.blur();
                targetTextarea.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }));
                targetTextarea.dispatchEvent(new FocusEvent('focusout', { bubbles: true, cancelable: true }));
                
                setTimeout(() => {
                    targetTextarea.focus({ preventScroll: true });
                    targetTextarea.blur();
                }, 10);
            } else {
                console.warn(`Textarea not found in question container`);
            }
        } else {
            console.warn(`Target element not found`);
        }
    } catch (error) {
        console.error('Error updating textarea:', error);
    }
}


function findFieldsetByText(searchText, attributeName, attributeValue, options = {}) {
  const {
    rootElement = document,
    selector = 'h3',
    caseSensitive = false
  } = options;
  
  // Normalize text
  const normalizeText = (text) => {
    let normalized = text
      .replace(/\*\*/g, '')  // Remove markdown
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
    
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized;
  };
  
  const cleanSearchText = normalizeText(searchText);
  const elements = rootElement.querySelectorAll(selector);
  //console.log(cleanSearchText)
  for (const element of elements) {
    const elementText = normalizeText(element.textContent || '');
    
    if (elementText.includes(cleanSearchText)) {
      let ancestor = element.parentElement?.parentElement?.parentElement?.parentElement;
      
      if (!ancestor) {
        console.warn('Could not find great-great-grandparent of h3');
        continue;
      } else {
       // console.log(ancestor)
      }
      
      const nextSibling = ancestor.nextElementSibling;
      
      if (!nextSibling) {
        console.warn('Great-great-grandparent has no next sibling');
        continue;
      } else {
        //console.log(nextSibling)
      }
      
      const firstChild = nextSibling.firstElementChild;
      
      if (firstChild && firstChild.tagName === 'FIELDSET') {
        firstChild.setAttribute(attributeName, attributeValue);
        return firstChild;
      } else {
        //console.log(firstchild)
      }
      
      // If first child isn't a fieldset, maybe it's nested deeper
      const fieldset = firstChild?.querySelector('fieldset');
      if (fieldset) {
        fieldset.setAttribute(attributeName, attributeValue);
        return fieldset;
      }
    }
  }
  
  return null;
}

function redoBody()
{
   if (window.responses && Array.isArray(window.responses)) {
      window.responses.forEach(response => {
        // Extract the model identifier from the response (e.g., "Response A" -> "A")
        const modelIdentifier = response.split(' ')[1] || response;
        
        for (let criterionNum = 1; criterionNum <= criteriaCount; criterionNum++) {
          // Call findFieldsetByText for each response-criterion pair
          let fieldset = findFieldsetByText(
            `Does ${response} satisfy Criterion #${criterionNum}?`,
            "data-response-criteria-pair",
            `${response} Criterion ${criterionNum}`
          );
          
          // Attach onchange event listener to the fieldset
          if (fieldset) {
            fieldset.addEventListener('change', function(event) {
              // For radio buttons, get the text from the span sibling
              if (event.target.type === 'radio') {
                const label = event.target.closest('label');
                if (label) {
                  const span = label.querySelector('span');
                  if (span) {
                    const labelText = span.textContent.trim();
                    this.setAttribute('data-value', labelText);
                    console.log(`Change detected for: ${response} Criterion ${criterionNum}`);
                    console.log('Set data-value to:', labelText);
                    recalculate();
                  }
                }
              } else {
                // Fallback for non-radio inputs
                this.setAttribute('data-value', event.target.value);
                console.log(`Change detected for: ${response} Criterion ${criterionNum}`);
                console.log('Set data-value to:', event.target.value);
                recalculate();
              }
            });
          }
          
          //console.log(`Set attribute for: ${response} Criterion ${criterionNum}`);
        }
      });
      
      //console.log(`Set attributes for ${window.responses.length * criteriaCount} fieldsets`);
    }

        for (let criterionNum = 1; criterionNum <= criteriaCount; criterionNum++) {
         fieldset = findFieldsetByText(
            `How should Criterion #${criterionNum} be weighted?`,
            `data-criterion-${criterionNum}-weight`,
            "null"
          );
          
          if (fieldset) {
            fieldset.addEventListener('change', function(event) {
              if (event.target.type === 'radio') {
                const label = event.target.closest('label');
                if (label) {
                  const span = label.querySelector('span');
                  if (span) {
                    const labelText = span.textContent.trim();
                    this.setAttribute(`data-criterion-${criterionNum}-weight`, labelText);
                    console.log(`Change detected for: Criterion ${criterionNum} weight`);
                    console.log('Set value to:', labelText);
                    recalculate();
                  }
                }
              } else {
                  this.setAttribute(`data-criterion-${criterionNum}-weight`, labelText);
                console.log(`Change detected for: Criterion ${criterionNum} weight`);
                console.log('Set value to:', event.target.value);
                recalculate();
              }
            });
          } else {
             console.log("weight Fieldset not found")
          }
          
         // console.log(`Set attribute for Criterion ${criterionNum} weight`);
        }

         for (let criterionNum = 1; criterionNum <= criteriaCount; criterionNum++) {
         fieldset = findFieldsetByText(
            `What kind of impact would the response have on you and/or the average user if Criterion #${criterionNum} was satisfied?`,
            `data-criterion-${criterionNum}-impact`,
            "null"
          );
          
          if (fieldset) {
            fieldset.addEventListener('change', function(event) {
              if (event.target.type === 'radio') {
                const label = event.target.closest('label');
                if (label) {
                  const span = label.querySelector('span');
                  if (span) {
                    const labelText = span.textContent.trim();
                    this.setAttribute(`data-criterion-${criterionNum}-impact`, labelText);
                    console.log(`Change detected for: Criterion ${criterionNum} impact`);
                    console.log('Set value to:', labelText);
                    recalculate();
                  }
                }
              } else {
                this.setAttribute('data-value', event.target.value);
                    this.setAttribute(`data-criterion-${criterionNum}-impact`, labelText);
                console.log('Set value to:', event.target.value);
                recalculate();
              }
            });
          } else {
            console.log("impact Fieldset not found")
          }
          
          //console.log(`Set attribute for Criterion ${criterionNum} impact`);
        }       

        for (let criterionNum = 1; criterionNum <= criteriaCount; criterionNum++) {
         fieldset = findFieldsetByText(
            `How many points should Criterion #${criterionNum} be worth?`,
            `data-criterion-${criterionNum}-reward`,
            "null"
          );
          
          if (fieldset) {
            fieldset.addEventListener('change', function(event) {
              if (event.target.type === 'radio') {
                const label = event.target.closest('label');
                if (label) {
                  const span = label.querySelector('span');
                  if (span) {
                    const labelText = span.textContent.trim();
                    this.setAttribute(`data-criterion-${criterionNum}-reward`, labelText);
                    console.log(`Change detected for: Criterion ${criterionNum} reward`);
                    console.log('Set value to:', labelText);
                    recalculate();
                  }
                }
              } else {
                this.setAttribute(`data-criterion-${criterionNum}-reward`, labelText);
                console.log(`Change detected for: Criterion ${criterionNum} reward`);
                console.log('Set value to:', event.target.value);
                recalculate();
              }
            });
          } else {
            console.log("impact Fieldset not found")
          }
          //console.log(`Set attribute for Criterion ${criterionNum} impact`);
        }   
      const addButton = Array.from(document.querySelectorAll('button')).find(
        button => button.textContent.trim() === '+ Add'
    );

    if (addButton) {
        addButton.addEventListener('click', function(event) {
            console.log('Add button clicked!');
            setTimeout(function() {
              addCriteriaWithCapture();
            }, 250)
        });
    }
}


function setProgressiveRewards() {
  console.log('Setting progressive rewards for all criteria...');
  
  for (let criterionNum = 1; criterionNum <= criteriaCount; criterionNum++) {
    let rewardNum = criterionNum;
    
    // Snake pattern: 1-10 ascending, 11-20 descending from 9, 21-30 ascending from 2, etc.
    if (criterionNum > 10) {
      const cyclePosition = (criterionNum - 1) % 20; // 0-19 repeating
      if (cyclePosition < 10) {
        // First half of cycle: 1-10
        rewardNum = cyclePosition + 1;
      } else {
        // Second half of cycle: count down from 10 to 1
        rewardNum = 20 - cyclePosition;
      }
    }
    
    const rewardValue = rewardNum.toString();
    console.log(`Criterion #${criterionNum} will get reward value ${rewardValue}`);
    
    // Find the fieldset for this criterion's reward
    const fieldset = findFieldsetByText(
      `How many points should Criterion #${criterionNum} be worth?`,
      `data-criterion-${criterionNum}-reward`,
      rewardValue
    );
    
    if (fieldset) {
      // Find the input/radio button with the matching value
      const inputs = fieldset.querySelectorAll('input[type="radio"], input[type="text"], input[type="number"]');
      
      let inputFound = false;
      for (const input of inputs) {
        // Check if this input's value matches our desired reward
        if (input.value === rewardValue) {
          // Set the input as checked/selected
          if (input.type === 'radio') {
            input.checked = true;
          } else {
            input.value = rewardValue;
          }
          
          // Trigger all the necessary events to ensure change handlers fire
          input.dispatchEvent(new Event('click', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Also trigger on the fieldset itself since your change handler is on the fieldset
          fieldset.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log(`Set reward ${rewardValue} for Criterion #${criterionNum}`);
          inputFound = true;
          break;
        }
      }
      
      if (!inputFound) {
        // If radio buttons don't have exact value match, try to find by label text
        const labels = fieldset.querySelectorAll('label');
        for (const label of labels) {
          const span = label.querySelector('span');
          if (span && span.textContent.trim() === rewardValue) {
            const input = label.querySelector('input');
            if (input) {
              input.checked = true;
              input.dispatchEvent(new Event('click', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              fieldset.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`Set reward ${rewardValue} for Criterion #${criterionNum} via label`);
              break;
            }
          }
        }
      }
    } else {
      console.warn(`Could not find reward fieldset for Criterion #${criterionNum}`);
    }
  }
  
  console.log('Progressive rewards setting complete');
}



function addCriteriaWithCapture() {
  // Capture current state before adding
  const capturedState = captureAttributes();
  
  const criterion = new Criterion();
  
  if (window.responses && Array.isArray(window.responses)) {
    window.responses.forEach(responseName => {
      criterion.scoreCard[responseName] = new Score();
    });
  }
  
  console.log("Before add: ", Tarot);
  Tarot.criteria.push(criterion);
  criteriaCount = Tarot.criteria.length; // Update criteria count
  console.log("After add: ", Tarot);
  console.log("New criteriaCount:", criteriaCount);
  
  // Since we're adding at the end, all existing criteria keep their indices
  // So we can restore with no deleted index
  setTimeout(function(){
    // Re-index the buttons to match the new array
    findCriteria(); 
    redoBody();
    
    // Restore the captured attributes after DOM recreation
    setTimeout(function(){
      recreateAttributes(capturedState, null);
      
      // Then recalculate with the restored values
      setTimeout(function(){
        recalculate();
      }, 100);
    }, 100);
  }, 150);

}


function addCriteria()
{
    const criterion = new Criterion();
    
    if (window.responses && Array.isArray(window.responses)) {
      window.responses.forEach(responseName => {
        criterion.scoreCard[responseName] = new Score();
      });
    }
    console.log("Before add: " + Tarot)
    Tarot.criteria.push(criterion);
    console.log("After add: " + Tarot)
}


function recalculate()
{
  let maxScore = 0
  let minScore = 0
  for (let i = 1; i <= criteriaCount; i++) {
    let penalty_text = document.querySelector(`[data-criterion-${i}-weight]`)?.getAttribute(`data-criterion-${i}-weight`)

    let penalty = penalties[penalty_text]

    Tarot.criteria[i - 1].penalty = parseInt(penalty,10)

    let reward = document.querySelector(`[data-criterion-${i}-reward]`)?.getAttribute(`data-criterion-${i}-reward`) 
    Tarot.criteria[i - 1].reward = parseInt(reward,10)  
    const parsed = parseInt(Tarot.criteria[i - 1].reward, 10);
    const parsedPenalty = parseInt(Tarot.criteria[i - 1].penalty, 10)
    if (!isNaN(parsed)) {
        maxScore += parsed;
    }
    if (!isNaN(parsedPenalty)) {
        minScore += parsedPenalty;
    }
    for (let j = 0; j < 4; j++)
    {
      let value = `${responses[j]} Criterion ${i}`
      let satisfies = document.querySelector(`[data-response-criteria-pair="${value}"]`)?.getAttribute('data-value');
      Tarot.criteria[i - 1].scoreCard[responses[j]].satisfies = satisfies

      if (satisfies == "Yes") {
        Tarot.criteria[i - 1].scoreCard[responses[j]].score = parsed
      } else if (satisfies == "No") {

        Tarot.criteria[i - 1].scoreCard[responses[j]].score = parsedPenalty
      } else {
        Tarot.criteria[i - 1].scoreCard[responses[j]].score = null
      }
       
    }  
  }

  for (let j = 0; j < 4; j++)
  {
      Tarot.responses[responses[j]] = 0
      for (let i = 1; i <= criteriaCount; i++) {
          Tarot.responses[responses[j]] += Tarot.criteria[i - 1].scoreCard[responses[j]].score 
      }       
  }  
  Tarot.maxScore = maxScore  
  Tarot.minScore = minScore  
  if (!enableLogging) {
      enableLogging = true
      console.log(Tarot)
      enableLogging = false
  } else {
    console.log(Tarot)
  } 
if (!isNaN(Tarot.maxScore)) {
  updateTextarea("data-max-score", Tarot.maxScore)
} else { console.log("skipping nan on max") }

if (!isNaN(Tarot.responses["Response A"])) {
  updateTextarea("data-response-a-score", Tarot.responses["Response A"])
} else { console.log("skipping nan on a") }

if (!isNaN(Tarot.responses["Response B"])) {
  updateTextarea("data-response-b-score", Tarot.responses["Response B"])
} else { console.log("skipping nan on b") }

if (!isNaN(Tarot.responses["Response C"])) {   
  updateTextarea("data-response-c-score", Tarot.responses["Response C"])
} else { console.log("skipping nan on c") }

if (!isNaN(Tarot.responses["Response D"])) {
    updateTextarea("data-response-d-score", Tarot.responses["Response D"]) 
}    else { console.log("skipping nan on d") }

}



  
  function gatherVariables() {
    // dunno why I did it like this, fix later
    document.querySelectorAll('*').forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-tc-')) {
          const varName = attr.name.substring(8);
          let value = attr.value;
          try {
            value = JSON.parse(value);
          } catch (e) {}
          console.log(`found ${varName}, set to ${value}`)  
          window[varName] = value;
        }
      });
      window.responses = ["Response A", "Response B", "Response C", "Response D"]
    });
    

  }

  /*new MutationObserver(() => {
    const newButtons = document.querySelectorAll('[data-testid="delete-button"]');
    if (newButtons.length !== criteriaCount) {
      console.log(`Change detected: ${criteriaCount} to ${newButtons.length}`);
          criteriaCount = newButtons.length;
    
  }

  }).observe(document.body, { childList: true, subtree: true });*/  
document.addEventListener('keydown', function(event) {
  // Check for Shift + Option/Alt + Backslash
  // On Mac, Option key is event.altKey
  // Backslash key code is 220 or the key is '\'
  if (event.shiftKey && event.altKey && (event.keyCode === 220 || event.key === '\\')) {
    event.preventDefault(); // Prevent any default behavior
    console.log('Shift + Option + Backslash detected! Setting progressive rewards...');
    setProgressiveRewards();
  }
})

  setTimeout(() => {
     findCriteria()     
    for (let i = 0; i < criteriaCount; i++) {
      const criterion = new Criterion();
      
      if (window.responses && Array.isArray(window.responses)) {
        window.responses.forEach(responseName => {
          criterion.scoreCard[responseName] = new Score();
        });
      }
      Tarot.criteria.push(criterion);
    }
    
    console.log('Tarot object with criteria:', Tarot);
    console.log(`Created ${Tarot.criteria.length} criteria`);
    
    Tarot.criteria.forEach((criterion, index) => {
      console.log(`Criterion ${index + 1}:`, {
        penalty: criterion.penalty,
        reward: criterion.reward,
        scoreCard: criterion.scoreCard
      });
    });
   redoBody();
   
  }, 1500)
}
