// Hot Streak Detection Function
function detectHotStreak(fightHistory) {
    if (!fightHistory || fightHistory.length < 3) {
        return null;
    }

    // Sort fights by date (most recent first)
    const sortedFights = [...fightHistory].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    let streakData = {
        hasStreak: false,
        winStreak: 0,
        methodStreak: null,
        methodCount: 0,
        recentWins: []
    };

    // Check for win streak
    for (let i = 0; i < sortedFights.length; i++) {
        const fight = sortedFights[i];
        const isWin = fight.result === 'W' || fight.result === 'Win';
        
        if (isWin) {
            streakData.winStreak++;
            streakData.recentWins.push(fight);
        } else {
            break; // Streak ended
        }
    }

    // Only consider it a hot streak if 3+ wins
    if (streakData.winStreak >= 3) {
        streakData.hasStreak = true;

        // Check for method-specific streaks
        const methods = streakData.recentWins.map(f => {
            const method = f.method || f.winMethod || '';
            // Normalize method names
            if (method.includes('KO') || method.includes('TKO') || method.includes('Knockout')) {
                return 'KO/TKO';
            } else if (method.includes('Sub') || method.includes('Submission')) {
                return 'Submission';
            } else if (method.includes('Decision') || method.includes('Dec')) {
                return 'Decision';
            }
            return method;
        });

        // Check if all wins are by the same method
        const firstMethod = methods[0];
        if (methods.every(m => m === firstMethod) && firstMethod) {
            streakData.methodStreak = firstMethod;
            streakData.methodCount = methods.length;
        }
    }

    return streakData;
}

// Function to render hot streak badge in Fighter Insights
function renderHotStreakBadge(streakData) {
    if (!streakData || !streakData.hasStreak) {
        return '';
    }

    const isMethodStreak = streakData.methodStreak && streakData.methodCount >= 3;
    const badgeClass = isMethodStreak ? 'hot-streak-badge method-streak-badge' : 'hot-streak-badge';
    
    let badgeText = '';
    if (isMethodStreak) {
        badgeText = `🔥🔥 ${streakData.methodCount}x ${streakData.methodStreak} STREAK! 🔥🔥`;
    } else {
        badgeText = `🔥 ${streakData.winStreak} FIGHT HOT STREAK 🔥`;
    }

    return `
        <div class="streak-container">
            <div class="${badgeClass}">
                <span class="fire-emoji">🔥</span>
                <span>${badgeText}</span>
                <span class="fire-emoji">🔥</span>
            </div>
            <div class="streak-stats">
                <div class="streak-stat-item">
                    <span>Current Win Streak:</span>
                    <strong>${streakData.winStreak} wins</strong>
                </div>
                ${isMethodStreak ? `
                    <div class="streak-stat-item">
                        <span>All by ${streakData.methodStreak}:</span>
                        <strong>🎯 Perfect execution!</strong>
                    </div>
                ` : ''}
                <div class="streak-stat-item">
                    <span>Recent Form:</span>
                    <strong style="color: #4ade80;">${'W '.repeat(streakData.winStreak).trim()}</strong>
                </div>
            </div>
        </div>
    `;
}

// Integration into Fighter Insights popup
function enhanceFighterInsightsWithStreak(fighterData) {
    const streakData = detectHotStreak(fighterData.fightHistory);
    const streakHTML = renderHotStreakBadge(streakData);
    
    // Add streak badge to the top of the insights popup
    const insightsContainer = document.querySelector('.fighter-insights-content');
    if (insightsContainer && streakHTML) {
        insightsContainer.insertAdjacentHTML('afterbegin', streakHTML);
    }
}