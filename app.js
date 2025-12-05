// 1x1 Training App
// Main Application Logic

class MathTrainingApp {
    constructor() {
        this.currentView = 'training';
        this.currentMode = null; // 'training' or 'test'
        this.selectedSeries = [];
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.questionCount = 10;
        this.stats = this.loadStats();
        this.settings = this.loadSettings();

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettingsUI();
        this.showView('training');
        this.updateStatistics();
    }

    // ==================== Event Binding ====================
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.showView(view);
            });
        });

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            this.handleBackButton();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('close-settings-btn').addEventListener('click', () => {
            this.hideSettings();
        });

        document.getElementById('reset-stats-btn').addEventListener('click', () => {
            if (confirm('Möchtest du wirklich alle Statistiken zurücksetzen?')) {
                this.resetStats();
                this.hideSettings();
            }
        });

        // Settings: Enable/disable division and sqrt
        document.getElementById('enable-division').addEventListener('change', (e) => {
            this.settings.enableDivision = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('enable-sqrt').addEventListener('change', (e) => {
            this.settings.enableSqrt = e.target.checked;
            this.saveSettings();
        });

        // Training mode: Series selection
        document.querySelectorAll('.series-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const series = parseInt(e.currentTarget.dataset.series);
                this.startTraining([series]);
            });
        });

        // Test mode: Question count
        document.getElementById('question-count-btn').addEventListener('click', () => {
            this.showCountSelector();
        });

        document.querySelectorAll('.count-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.questionCount = parseInt(e.currentTarget.dataset.count);
                document.getElementById('question-count-btn').textContent = this.questionCount;
                this.hideCountSelector();
            });
        });

        // Test mode: Start test
        document.getElementById('start-test-btn').addEventListener('click', () => {
            this.startTest();
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    // ==================== View Management ====================
    showView(viewName) {
        this.currentView = viewName;

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected view
        const navBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
        if (navBtn) navBtn.classList.add('active');

        // Update header and show appropriate view
        const backBtn = document.getElementById('back-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const menuBtn = document.getElementById('menu-btn');
        const pageTitle = document.getElementById('page-title');

        backBtn.classList.add('hidden');
        settingsBtn.classList.remove('hidden');
        menuBtn.classList.remove('hidden');

        switch(viewName) {
            case 'training':
                pageTitle.textContent = 'Training';
                document.getElementById('training-selection').classList.remove('hidden');
                break;
            case 'test':
                pageTitle.textContent = 'Rechentest';
                document.getElementById('test-selection').classList.remove('hidden');
                break;
            case 'statistics':
                pageTitle.textContent = 'Statistiken';
                document.getElementById('statistics-view').classList.remove('hidden');
                this.updateStatistics();
                break;
        }
    }

    handleBackButton() {
        if (document.getElementById('quiz-view').classList.contains('hidden') === false) {
            // Exit quiz
            if (confirm('Möchtest du das Quiz wirklich beenden?')) {
                this.showView(this.currentMode === 'training' ? 'training' : 'test');
            }
        }
    }

    showSettings() {
        document.getElementById('settings-menu').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-menu').classList.add('hidden');
    }

    showCountSelector() {
        document.getElementById('count-selector').classList.remove('hidden');
    }

    hideCountSelector() {
        document.getElementById('count-selector').classList.add('hidden');
    }

    // ==================== Quiz Logic ====================
    startTraining(series) {
        this.currentMode = 'training';
        this.selectedSeries = series;
        this.generateQuestions();
        this.startQuiz();
    }

    startTest() {
        this.currentMode = 'test';

        // Get selected series from checkboxes
        const checkboxes = document.querySelectorAll('#test-selection input[type="checkbox"]:checked');
        this.selectedSeries = Array.from(checkboxes).map(cb => parseInt(cb.value));

        if (this.selectedSeries.length === 0) {
            alert('Bitte wähle mindestens eine Malreihe aus!');
            return;
        }

        this.generateQuestions();
        this.startQuiz();
    }

    generateQuestions() {
        this.currentQuestions = [];
        const types = ['multiplication'];
        if (this.settings.enableDivision) types.push('division');
        if (this.settings.enableSqrt) types.push('sqrt');

        // Use spaced repetition for test mode
        if (this.currentMode === 'test') {
            this.currentQuestions = this.generateSpacedRepetitionQuestions();
        } else {
            // Training mode: all questions for selected series
            for (let i = 0; i < this.questionCount; i++) {
                const series = this.selectedSeries[Math.floor(Math.random() * this.selectedSeries.length)];
                const type = types[Math.floor(Math.random() * types.length)];
                const question = this.generateQuestion(series, type);
                if (question) this.currentQuestions.push(question);
            }
        }

        this.currentQuestionIndex = 0;
    }

    generateSpacedRepetitionQuestions() {
        const questions = [];
        const allPossibleQuestions = [];

        // Generate all possible questions for selected series
        this.selectedSeries.forEach(series => {
            // Multiplication: all combinations from 1 to 12
            for (let i = 1; i <= 12; i++) {
                const question = {
                    key: `${series}x${i}`,
                    text: `${series} × ${i} = ?`,
                    answer: series * i,
                    type: 'multiplication'
                };
                allPossibleQuestions.push(question);
            }

            // Division: all combinations from 1 to 12
            if (this.settings.enableDivision) {
                for (let i = 1; i <= 12; i++) {
                    const dividend = series * i;
                    const question = {
                        key: `${dividend}/${series}`,
                        text: `${dividend} ÷ ${series} = ?`,
                        answer: i,
                        type: 'division'
                    };
                    allPossibleQuestions.push(question);
                }
            }
        });

        // Sqrt: all perfect squares (independent of series)
        if (this.settings.enableSqrt) {
            const perfectSquares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
            perfectSquares.forEach(square => {
                const root = Math.sqrt(square);
                if (root >= 1 && root <= 12) {
                    const question = {
                        key: `√${square}`,
                        text: `√${square} = ?`,
                        answer: root,
                        type: 'sqrt'
                    };
                    allPossibleQuestions.push(question);
                }
            });
        }

        // Sort by performance (worst first) using Leitner system
        const weightedQuestions = allPossibleQuestions.map(q => {
            const stats = this.getQuestionStats(q.key);
            const successRate = stats.total > 0 ? stats.correct / stats.total : 0;

            // Leitner box system: 4 boxes
            let weight;
            if (stats.total === 0) {
                weight = 10; // Box 1: Never seen
            } else if (successRate < 0.5) {
                weight = 8; // Box 1: Poor performance
            } else if (successRate < 0.8) {
                weight = 4; // Box 2: Medium performance
            } else if (successRate < 0.95) {
                weight = 2; // Box 3: Good performance
            } else {
                weight = 1; // Box 4: Excellent performance
            }

            return { question: q, weight };
        });

        // Weighted random selection
        for (let i = 0; i < this.questionCount && weightedQuestions.length > 0; i++) {
            const totalWeight = weightedQuestions.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;

            let selectedIndex = 0;
            for (let j = 0; j < weightedQuestions.length; j++) {
                random -= weightedQuestions[j].weight;
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }

            questions.push(weightedQuestions[selectedIndex].question);
            weightedQuestions.splice(selectedIndex, 1);
        }

        return questions;
    }

    generateQuestion(series, type) {
        let question = null;

        switch(type) {
            case 'multiplication':
                const multiplier = Math.floor(Math.random() * 12) + 1;
                question = {
                    key: `${series}x${multiplier}`,
                    text: `${series} × ${multiplier} = ?`,
                    answer: series * multiplier,
                    type: 'multiplication'
                };
                break;

            case 'division':
                const divisor = Math.floor(Math.random() * 12) + 1;
                const dividend = series * divisor;
                question = {
                    key: `${dividend}/${series}`,
                    text: `${dividend} ÷ ${series} = ?`,
                    answer: divisor,
                    type: 'division'
                };
                break;

            case 'sqrt':
                // Only perfect squares up to 144
                const perfectSquares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
                const validSquares = perfectSquares.filter(sq => {
                    const root = Math.sqrt(sq);
                    return root >= 1 && root <= 12;
                });

                if (validSquares.length > 0) {
                    const square = validSquares[Math.floor(Math.random() * validSquares.length)];
                    const root = Math.sqrt(square);
                    question = {
                        key: `√${square}`,
                        text: `√${square} = ?`,
                        answer: root,
                        type: 'sqrt'
                    };
                }
                break;
        }

        return question;
    }

    startQuiz() {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });

        // Show quiz view
        document.getElementById('quiz-view').classList.remove('hidden');

        // Update header
        document.getElementById('back-btn').classList.remove('hidden');
        document.getElementById('settings-btn').classList.add('hidden');
        document.getElementById('menu-btn').classList.add('hidden');
        document.getElementById('page-title').textContent =
            this.currentMode === 'training' ? 'Training' : 'Rechentest';

        // Show first question
        this.showQuestion();
    }

    showQuestion() {
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            this.endQuiz();
            return;
        }

        const question = this.currentQuestions[this.currentQuestionIndex];

        // Update progress
        const progress = ((this.currentQuestionIndex) / this.currentQuestions.length) * 100;
        document.getElementById('progress').style.width = `${progress}%`;

        // Update question counter
        document.getElementById('question-counter').textContent =
            `${this.currentQuestionIndex + 1} / ${this.currentQuestions.length}`;

        // Update question text
        document.getElementById('question-text').textContent = question.text;

        // Generate answer options
        const answers = this.generateAnswerOptions(question.answer);
        const answersContainer = document.getElementById('answers');
        answersContainer.innerHTML = '';

        answers.forEach(answer => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = answer;
            btn.addEventListener('click', () => this.handleAnswer(answer, question.answer, question.key));
            answersContainer.appendChild(btn);
        });
    }

    generateAnswerOptions(correctAnswer) {
        const options = new Set([correctAnswer]);
        const numOptions = Math.random() < 0.5 ? 4 : 5; // 4 or 5 options

        while (options.size < numOptions) {
            let wrongAnswer;
            const offset = Math.floor(Math.random() * 10) - 5; // -5 to +5
            wrongAnswer = correctAnswer + offset;

            // Ensure wrong answer is positive and different
            if (wrongAnswer > 0 && wrongAnswer !== correctAnswer) {
                options.add(wrongAnswer);
            }
        }

        // Shuffle and return
        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    handleAnswer(selectedAnswer, correctAnswer, questionKey) {
        const buttons = document.querySelectorAll('.answer-btn');
        const isCorrect = selectedAnswer === correctAnswer;

        // Update stats
        this.updateQuestionStats(questionKey, isCorrect);

        // Visual feedback
        buttons.forEach(btn => {
            btn.classList.add('disabled');
            if (parseInt(btn.textContent) === correctAnswer) {
                btn.classList.add('correct');
            } else if (parseInt(btn.textContent) === selectedAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        // Move to next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.showQuestion();
        }, 1000);
    }

    endQuiz() {
        // Update progress to 100%
        document.getElementById('progress').style.width = '100%';

        // Show completion message
        setTimeout(() => {
            alert('Quiz abgeschlossen! Gut gemacht!');
            this.showView(this.currentMode === 'training' ? 'training' : 'test');
        }, 500);
    }

    // ==================== Statistics Management ====================
    loadStats() {
        const stored = localStorage.getItem('mathTrainingStats');
        return stored ? JSON.parse(stored) : {};
    }

    saveStats() {
        localStorage.setItem('mathTrainingStats', JSON.stringify(this.stats));
    }

    loadSettings() {
        const stored = localStorage.getItem('mathTrainingSettings');
        return stored ? JSON.parse(stored) : {
            enableDivision: true,
            enableSqrt: true
        };
    }

    saveSettings() {
        localStorage.setItem('mathTrainingSettings', JSON.stringify(this.settings));
    }

    loadSettingsUI() {
        document.getElementById('enable-division').checked = this.settings.enableDivision;
        document.getElementById('enable-sqrt').checked = this.settings.enableSqrt;
    }

    getQuestionStats(key) {
        if (!this.stats[key]) {
            this.stats[key] = { correct: 0, total: 0 };
        }
        return this.stats[key];
    }

    updateQuestionStats(key, isCorrect) {
        const stats = this.getQuestionStats(key);
        stats.total++;
        if (isCorrect) stats.correct++;
        this.saveStats();
    }

    resetStats() {
        this.stats = {};
        this.saveStats();
        this.updateStatistics();
        alert('Statistiken wurden zurückgesetzt!');
    }

    updateStatistics() {
        const container = document.getElementById('stats-content');
        container.innerHTML = '';

        // Generate statistics for each series (2-12)
        for (let series = 2; series <= 12; series++) {
            const seriesDiv = document.createElement('div');
            seriesDiv.className = 'series-stats';

            const title = document.createElement('div');
            title.className = 'series-title';
            title.textContent = `${series}ER-REIHE`;
            seriesDiv.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'stats-grid';

            // Show stats for each operation
            for (let i = 2; i <= 12; i++) {
                const key = `${series}x${i}`;
                const stats = this.getQuestionStats(key);
                const successRate = stats.total > 0 ? (stats.correct / stats.total) : -1;

                const item = document.createElement('div');
                item.className = 'stat-item';

                const circle = document.createElement('div');
                circle.className = 'stat-circle';

                if (successRate < 0) {
                    circle.classList.add('unknown');
                    circle.textContent = '?';
                } else if (successRate < 0.5) {
                    circle.classList.add('danger');
                    circle.textContent = '';
                } else if (successRate < 0.65) {
                    circle.classList.add('warning-orange');
                    circle.textContent = '';
                } else if (successRate < 0.8) {
                    circle.classList.add('warning-yellow');
                    circle.textContent = '';
                } else if (successRate < 0.9) {
                    circle.classList.add('success-light');
                    circle.textContent = '';
                } else {
                    circle.classList.add('success');
                    circle.textContent = '';
                }

                const label = document.createElement('div');
                label.className = 'stat-label';
                label.textContent = `${series} × ${i}`;

                item.appendChild(circle);
                item.appendChild(label);
                grid.appendChild(item);
            }

            seriesDiv.appendChild(grid);
            container.appendChild(seriesDiv);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MathTrainingApp();
});
