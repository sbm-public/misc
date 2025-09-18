window.responses = ["Response A", "Response B", "Response C", "Response D"];
window.custom = function() {
    
    const CONFIG = {
        PENALTIES: {
            "Dealbreaker": -10,
            "Essential": -5,
            "Valuable": -3,
            "Nice to Have": 0
        },
        SELECTORS: {
            DELETE_BUTTON: '[data-testid="delete-button"]',
            CONFIRM_DELETE: '[aria-label="Confirm Deletion"]',
            CANCEL_DELETE: '[aria-label="Cancel Deletion"]',
            ADD_BUTTON_TEXT: '+ Add'
        },
        DELAYS: {
            AFTER_DELETE: 150,
            AFTER_ADD: 250,
            RECREATION: 100,
            RECALCULATION: 100,
            INITIALIZATION: 1500
        }
    };

    class Criterion {
        constructor(penalty = null, reward = null, weight = null) {
            this.penalty = penalty;
            this.reward = reward;
            this.scoreCard = {};
        }
    }

    class Criteria {
        constructor(maxScore = null, minScore = null) {
            this.maxScore = maxScore;
            this.minScore = minScore;
            this.criteria = [];
            this.responses = {};
            for (let i = 0; i < responses.length; i++) {
                this.responses[responses[i]] = 0;
            }
        }
    }

    class Score {
        constructor(score = null, satisfies = null) {
            this.satisfies = satisfies;
            this.score = score;
        }
    }

    const AppState = {
        pendingDelete: 0,
        criteriaCount: 0,
        enableLogging: true,
        tarot: null,
        originalLog: console.log,
        
        init() {
            this.tarot = new Criteria();
            this.setupLogging();
        },
        
        setupLogging() {
            const self = this;
            console.log = function(...args) {
                if (self.enableLogging) {
                    self.originalLog.apply(console, args);
                }
            };
        }
    };

    const Logger = {
        log(message, data) {
            if (AppState.enableLogging) {
                console.log(message, data || '');
            }
        },
        
        logWithoutFlag(message, data) {
            const wasEnabled = AppState.enableLogging;
            AppState.enableLogging = true;
            console.log(message, data || '');
            AppState.enableLogging = wasEnabled;
        }
    };

    const DOMHelpers = {
        findFieldsetByText(searchText, attributeName, attributeValue, options = {}) {
            const {
                rootElement = document,
                selector = 'h3',
                caseSensitive = false
            } = options;

            const normalizeText = (text) => {
                let normalized = text
                    .replace(/\*\*/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                return caseSensitive ? normalized : normalized.toLowerCase();
            };

            const cleanSearchText = normalizeText(searchText);
            const elements = rootElement.querySelectorAll(selector);

            for (const element of elements) {
                const elementText = normalizeText(element.textContent || '');
                
                if (elementText.includes(cleanSearchText)) {
                    let ancestor = element.parentElement?.parentElement?.parentElement?.parentElement;
                    if (!ancestor) continue;
                    
                    const nextSibling = ancestor.nextElementSibling;
                    if (!nextSibling) continue;
                    
                    const firstChild = nextSibling.firstElementChild;
                    
                    if (firstChild && firstChild.tagName === 'FIELDSET') {
                        firstChild.setAttribute(attributeName, attributeValue);
                        return firstChild;
                    }
                    
                    const fieldset = firstChild?.querySelector('fieldset');
                    if (fieldset) {
                        fieldset.setAttribute(attributeName, attributeValue);
                        return fieldset;
                    }
                }
            }
            return null;
        },
        hideScoreFields() {
            for (let i = 28; i <= 32; i++) {
                const element = document.getElementById(`question-${i}`);
                if (element) {
                    element.style.display = 'none';
                }
            }
        },
        updateTextarea(attributeName, value) {
            // the results-table secret sauce
            try {
                const element = document.querySelector(`[${attributeName}]`);
                if (!element) {
                    Logger.log(`Element with attribute ${attributeName} not found`);
                    return;
                }
                
                const container = element.closest('[id^="question-"]');
                if (!container) {
                    Logger.log(`Parent question container not found for ${attributeName}`);
                    return;
                }
                
                const textarea = container.querySelector('textarea');
                if (!textarea) {
                    Logger.log(`Textarea not found in question container`);
                    return;
                }
                
                textarea.focus({ preventScroll: true });
                
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, 
                    "value"
                ).set;
                nativeInputValueSetter.call(textarea, value);
                
                textarea.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    inputType: 'insertText',
                    data: value
                }));
                
                textarea.dispatchEvent(new Event('change', {
                    bubbles: true,
                    cancelable: true
                }));
                
                textarea.classList.add('ng-touched', 'ng-dirty');
                textarea.classList.remove('ng-pristine', 'ng-untouched');
                
                const parentDiv = textarea.parentElement;
                const previousSiblingDiv = parentDiv?.previousElementSibling;
                if (previousSiblingDiv) {
                    previousSiblingDiv.textContent = value;
                }
                
                textarea.blur();
                
            } catch (error) {
                console.error('Error updating textarea:', error);
            }
        },

        extractValueFromEvent(event) {
            if (event.target.type === 'radio') {
                const label = event.target.closest('label');
                return label?.querySelector('span')?.textContent.trim() || '';
            }
            return event.target.value;
        },

        setupFieldsetListener(searchText, attributePattern, criterionNum, type) {
            const fieldset = this.findFieldsetByText(searchText, attributePattern, "null");
            
            if (fieldset) {
                fieldset.addEventListener('change', (event) => {
                    const value = this.extractValueFromEvent(event);
                    fieldset.setAttribute(attributePattern, value);
                    Logger.log(`Change detected for: Criterion ${criterionNum} ${type}`, value);
                    ScoreCalculator.recalculate();
                });
            }
            return fieldset;
        },

        setupEventListeners() {
            if (window.responses && Array.isArray(window.responses)) {
                window.responses.forEach(response => {
                    for (let criterionNum = 1; criterionNum <= AppState.criteriaCount; criterionNum++) {
                        const fieldset = this.findFieldsetByText(
                            `Does ${response} satisfy Criterion #${criterionNum}?`,
                            "data-response-criteria-pair",
                            `${response} Criterion ${criterionNum}`
                        );
                        
                        if (fieldset) {
                            fieldset.addEventListener('change', (event) => {
                                const value = this.extractValueFromEvent(event);
                                fieldset.setAttribute('data-value', value);
                                Logger.log(`Change detected for: ${response} Criterion ${criterionNum}`, value);
                                ScoreCalculator.recalculate();
                            });
                        }
                    }
                });
            }
            
            for (let criterionNum = 1; criterionNum <= AppState.criteriaCount; criterionNum++) {
                this.setupFieldsetListener(
                    `How should Criterion #${criterionNum} be weighted?`,
                    `data-criterion-${criterionNum}-weight`,
                    criterionNum,
                    'weight'
                );
                
                this.setupFieldsetListener(
                    `What kind of impact would the response have on you and/or the average user if Criterion #${criterionNum} was satisfied?`,
                    `data-criterion-${criterionNum}-impact`,
                    criterionNum,
                    'impact'
                );
                
                this.setupFieldsetListener(
                    `How many points should Criterion #${criterionNum} be worth?`,
                    `data-criterion-${criterionNum}-reward`,
                    criterionNum,
                    'reward'
                );
            }
            
            const addButton = Array.from(document.querySelectorAll('button')).find(
                button => button.textContent.trim() === CONFIG.SELECTORS.ADD_BUTTON_TEXT
            );
            
            if (addButton) {
                addButton.addEventListener('click', () => {
                    Logger.log('Add button clicked!');
                    setTimeout(() => CriteriaManager.add(), CONFIG.DELAYS.AFTER_ADD);
                });
            }
        }
    };

    const AttributeManager = {
        capture() {
            const captured = {
                criteria: {},
                responsePairs: {}
            };

            for (let criterionNum = 1; criterionNum <= AppState.criteriaCount; criterionNum++) {
                captured.criteria[criterionNum] = {
                    weight: document.querySelector(`[data-criterion-${criterionNum}-weight]`)
                        ?.getAttribute(`data-criterion-${criterionNum}-weight`) || null,
                    impact: document.querySelector(`[data-criterion-${criterionNum}-impact]`)
                        ?.getAttribute(`data-criterion-${criterionNum}-impact`) || null,
                    reward: document.querySelector(`[data-criterion-${criterionNum}-reward]`)
                        ?.getAttribute(`data-criterion-${criterionNum}-reward`) || null
                };
            }

            if (window.responses && Array.isArray(window.responses)) {
                window.responses.forEach(response => {
                    captured.responsePairs[response] = {};
                    
                    for (let criterionNum = 1; criterionNum <= AppState.criteriaCount; criterionNum++) {
                        const pairKey = `${response} Criterion ${criterionNum}`;
                        const element = document.querySelector(`[data-response-criteria-pair="${pairKey}"]`);
                        
                        captured.responsePairs[response][criterionNum] = {
                            dataValue: element?.getAttribute('data-value') || null
                        };
                    }
                });
            }

            Logger.log('Captured attributes:', captured);
            return captured;
        },

        recreate(capturedData, deletedIndex = null) {
            if (!capturedData) {
                console.error('No captured data provided to recreateAttributes');
                return;
            }

            Logger.log('Recreating attributes, skipping deleted index:', deletedIndex);

            const getNewCriterionNum = (oldNum) => {
                if (deletedIndex === null) return oldNum;
                if (oldNum < deletedIndex) return oldNum;
                if (oldNum === deletedIndex) return null;
                return oldNum - 1;
            };

            Object.keys(capturedData.criteria).forEach(oldCriterionNum => {
                const oldNum = parseInt(oldCriterionNum);
                const newNum = getNewCriterionNum(oldNum);
                
                if (newNum === null) return;
                
                const criterionData = capturedData.criteria[oldCriterionNum];
                
                ['weight', 'impact', 'reward'].forEach(type => {
                    if (criterionData[type] && criterionData[type] !== "null") {
                        const searchText = this.getSearchTextForType(type, newNum);
                        DOMHelpers.findFieldsetByText(
                            searchText,
                            `data-criterion-${newNum}-${type}`,
                            criterionData[type]
                        );
                    }
                });
            });

            if (window.responses && Array.isArray(window.responses)) {
                window.responses.forEach(response => {
                    if (!capturedData.responsePairs[response]) return;
                    
                    Object.keys(capturedData.responsePairs[response]).forEach(oldCriterionNum => {
                        const oldNum = parseInt(oldCriterionNum);
                        const newNum = getNewCriterionNum(oldNum);
                        
                        if (newNum === null) return;
                        
                        const pairData = capturedData.responsePairs[response][oldCriterionNum];
                        const newPairKey = `${response} Criterion ${newNum}`;
                        
                        const fieldset = DOMHelpers.findFieldsetByText(
                            `Does ${response} satisfy Criterion #${newNum}?`,
                            "data-response-criteria-pair",
                            newPairKey
                        );
                        
                        if (fieldset && pairData.dataValue) {
                            fieldset.setAttribute('data-value', pairData.dataValue);
                        }
                    });
                });
            }
            
            Logger.log('Attribute recreation complete');
        },

        getSearchTextForType(type, criterionNum) {
            const searchTexts = {
                weight: `How should Criterion #${criterionNum} be weighted?`,
                impact: `What kind of impact would the response have on you and/or the average user if Criterion #${criterionNum} was satisfied?`,
                reward: `How many points should Criterion #${criterionNum} be worth?`
            };
            return searchTexts[type];
        }
    };

    const CriteriaManager = {
        find() {
            const buttons = document.querySelectorAll(CONFIG.SELECTORS.DELETE_BUTTON);
            
            if (buttons.length !== AppState.criteriaCount) {
                Logger.log(`Change detected: ${AppState.criteriaCount} to ${buttons.length}`);
            }
            
            AppState.criteriaCount = buttons.length;
            
            buttons.forEach((button, index) => {
                button.setAttribute('data-criteria', index + 1);
                
                if (button.getAttribute('data-event-set') !== "true") {
                    button.addEventListener('click', () => {
                        AppState.pendingDelete = index + 1;
                        Logger.log("Pending delete set to " + AppState.pendingDelete);
                        
                        setTimeout(() => this.setupDeleteConfirmation(), 100);
                    }, true);
                    
                    button.setAttribute('data-event-set', "true");
                }
            });
        },

        setupDeleteConfirmation() {
            const confirmButton = document.querySelector(CONFIG.SELECTORS.CONFIRM_DELETE);
            const cancelButton = document.querySelector(CONFIG.SELECTORS.CANCEL_DELETE);
            
            if (confirmButton && !confirmButton.hasAttribute('data-listener-added')) {
                confirmButton.setAttribute('data-listener-added', 'true');
                confirmButton.addEventListener('click', () => this.delete());
            }
            
            if (cancelButton && !cancelButton.hasAttribute('data-listener-added')) {
                cancelButton.setAttribute('data-listener-added', 'true');
                cancelButton.addEventListener('click', () => this.find());
            }
        },

        add() {
            const capturedState = AttributeManager.capture();
            const criterion = this.createNewCriterion();
            
            AppState.tarot.criteria.push(criterion);
            AppState.criteriaCount = AppState.tarot.criteria.length;
            
            Logger.log("After add: ", AppState.tarot);
            
            this.refreshUI(capturedState, null);
        },

        delete() {
            const capturedState = AttributeManager.capture();
            const indexToDelete = parseInt(AppState.pendingDelete, 10);
            const arrayIndexToDelete = indexToDelete - 1;
            
            if (arrayIndexToDelete >= 0 && arrayIndexToDelete < AppState.tarot.criteria.length) {
                AppState.tarot.criteria.splice(arrayIndexToDelete, 1);
                AppState.criteriaCount = AppState.tarot.criteria.length;
                
                Logger.log(`Deleted criterion ${indexToDelete}`);
            } else {
                console.error('Invalid index:', arrayIndexToDelete);
            }
            
            AppState.pendingDelete = 0;
            this.refreshUI(capturedState, indexToDelete);
        },

        createNewCriterion() {
            const criterion = new Criterion();
            
            if (window.responses && Array.isArray(window.responses)) {
                window.responses.forEach(responseName => {
                    criterion.scoreCard[responseName] = new Score();
                });
            }
            
            return criterion;
        },

        refreshUI(capturedState, deletedIndex) {
            setTimeout(() => {
                this.find();
                DOMHelpers.setupEventListeners();
                
                setTimeout(() => {
                    AttributeManager.recreate(capturedState, deletedIndex);
                    
                    setTimeout(() => {
                        ScoreCalculator.recalculate();
                    }, CONFIG.DELAYS.RECALCULATION);
                }, CONFIG.DELAYS.RECREATION);
            }, CONFIG.DELAYS.AFTER_DELETE);
        }
    };

    const ScoreCalculator = {
        recalculate() {
            let maxScore = 0;
            let minScore = 0;
            
            for (let i = 1; i <= AppState.criteriaCount; i++) {
                const criterion = AppState.tarot.criteria[i - 1];
                
                // penalty from weight
                const penaltyText = document.querySelector(`[data-criterion-${i}-weight]`)
                    ?.getAttribute(`data-criterion-${i}-weight`);
                const penalty = CONFIG.PENALTIES[penaltyText];
                criterion.penalty = parseInt(penalty, 10);
                
                // reward
                const reward = document.querySelector(`[data-criterion-${i}-reward]`)
                    ?.getAttribute(`data-criterion-${i}-reward`);
                criterion.reward = parseInt(reward, 10);
                
                // calc max and min scores
                if (!isNaN(criterion.reward)) {
                    maxScore += criterion.reward;
                }
                if (!isNaN(criterion.penalty)) {
                    minScore += criterion.penalty;
                }
                
                // per crit scores for each response
                for (let j = 0; j < window.responses.length; j++) {
                    const response = window.responses[j];
                    const value = `${response} Criterion ${i}`;
                    const satisfies = document.querySelector(`[data-response-criteria-pair="${value}"]`)
                        ?.getAttribute('data-value');
                    
                    criterion.scoreCard[response].satisfies = satisfies;
                    
                    if (satisfies === "Yes") {
                        criterion.scoreCard[response].score = criterion.reward;
                    } else if (satisfies === "No") {
                        criterion.scoreCard[response].score = criterion.penalty;
                    } else {
                        criterion.scoreCard[response].score = null;
                    }
                }
            }
            
            // total scores for each response
            for (let j = 0; j < window.responses.length; j++) {
                const response = window.responses[j];
                AppState.tarot.responses[response] = 0;
                
                for (let i = 1; i <= AppState.criteriaCount; i++) {
                    const score = AppState.tarot.criteria[i - 1].scoreCard[response].score;
                    if (score !== null) {
                        AppState.tarot.responses[response] += score;
                    }
                }
            }
            
            AppState.tarot.maxScore = maxScore;
            AppState.tarot.minScore = minScore;
            
            Logger.log('Recalculated:', AppState.tarot);
            this.updateScoreDisplays();
        },

        updateScoreDisplays() {
            if (!isNaN(AppState.tarot.maxScore)) {
                DOMHelpers.updateTextarea("data-max-score", AppState.tarot.maxScore);
            }
            
            ["Response A", "Response B", "Response C", "Response D"].forEach(response => {
                if (!isNaN(AppState.tarot.responses[response])) {
                    const attributeName = `data-${response.toLowerCase().replace(' ', '-')}-score`;
                    DOMHelpers.updateTextarea(attributeName, AppState.tarot.responses[response]);
                }
            });
        }
    };

    function initialize() {
        AppState.init();
        CriteriaManager.find();
        
        for (let i = 0; i < AppState.criteriaCount; i++) {
            AppState.tarot.criteria.push(CriteriaManager.createNewCriterion());
        }
        
        Logger.log('Initialized with criteria:', AppState.tarot.criteria);
        DOMHelpers.setupEventListeners();
        DOMHelpers.hideScoreFields();
    }

    setTimeout(initialize, CONFIG.DELAYS.INITIALIZATION);
};