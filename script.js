document.addEventListener('DOMContentLoaded', () => {
    // Элементы управления
    const nameInput = document.getElementById('name-input');
    const initiativeInput = document.getElementById('initiative-input');
    const acInput = document.getElementById('ac-input');
    const hpInput = document.getElementById('hp-input');
    const multiattackSelect = document.getElementById('multiattack-select');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const addEnemyBtn = document.getElementById('add-enemy-btn');
    const nextTurnBtn = document.getElementById('next-turn-btn');
    const initiativeList = document.getElementById('initiative-list');
    const currentTurnDisplay = document.getElementById('current-turn');
    const roundCountDisplay = document.getElementById('round-count');
    const conditionSelect = document.getElementById('condition-select');
    const conditionDuration = document.getElementById('condition-duration');
    const addConditionBtn = document.getElementById('add-condition-btn');
    const currentUnitConditions = document.getElementById('current-unit-conditions');
    const unitNotes = document.getElementById('unit-notes');
    const saveNotesBtn = document.getElementById('save-notes-btn');

    // Данные
    let participants = [];
    let currentTurnIndex = 0;
    let roundCount = 1;
    let currentActiveParticipant = null;

    // Инициализация
    initEventListeners();

    function initEventListeners() {
        addPlayerBtn.addEventListener('click', () => addParticipant('player'));
        addEnemyBtn.addEventListener('click', () => addParticipant('enemy'));
        nextTurnBtn.addEventListener('click', nextTurn);
        addConditionBtn.addEventListener('click', addConditionToCurrentUnit);
        saveNotesBtn.addEventListener('click', saveNotesForCurrentUnit);

        // Обработка Enter в полях ввода
        [nameInput, initiativeInput, acInput, hpInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addParticipant('player');
            });
        });
    }

    function addParticipant(type) {
        const name = nameInput.value.trim();
        const initiative = parseInt(initiativeInput.value);
        const ac = parseInt(acInput.value);
        const hp = parseInt(hpInput.value);
        const hasMultiattack = multiattackSelect.value === 'yes';

        if (!validateInputs(name, initiative, ac, hp)) return;

        const participant = {
            id: Date.now(),
            name,
            initiative,
            ac,
            currentHp: hp,
            maxHp: hp,
            hasMultiattack,
            type,
            conditions: [],
            notes: ''
        };

        participants.push(participant);
        sortParticipants();
        renderList();
        updateCurrentTurnDisplay();
        clearInputFields();
    }

    function validateInputs(name, initiative, ac, hp) {
        if (!name) {
            alert('Пожалуйста, введите имя персонажа!');
            return false;
        }
        if (isNaN(initiative)) {
            alert('Пожалуйста, введите корректное значение инициативы!');
            return false;
        }
        if (isNaN(ac)) {
            alert('Пожалуйста, введите корректное значение КД!');
            return false;
        }
        if (isNaN(hp)) {
            alert('Пожалуйста, введите корректное количество хитов!');
            return false;
        }
        return true;
    }

    function clearInputFields() {
        nameInput.value = '';
        initiativeInput.value = '';
        acInput.value = '';
        hpInput.value = '';
        multiattackSelect.value = 'no';
        nameInput.focus();
    }

    function sortParticipants() {
        participants.sort((a, b) => b.initiative - a.initiative);
    }

    function renderList() {
        initiativeList.innerHTML = participants.length === 0
            ? '<p class="empty-message">Добавьте участников, чтобы начать</p>'
            : participants.map((p, i) => createParticipantElement(p, i)).join('');

        if (participants.length > 0) {
            addParticipantEventListeners();
        }
    }

    function createParticipantElement(participant, index) {
        const isCurrentTurn = index === currentTurnIndex;
        return `
            <div class="initiative-item ${participant.type} ${isCurrentTurn ? 'current-turn' : ''}" data-id="${participant.id}">
                <div class="initiative-info">
                    <span class="name">${participant.name}</span>
                    <div class="stats">
                        <span>Иниц: ${participant.initiative}</span>
                        <span>КД: ${participant.ac}</span>
                        <span class="multiattack-indicator" title="Мультиатака">${participant.hasMultiattack ? 'МА ✓' : 'МА ✗'}</span>
                    </div>
                </div>
                <div class="initiative-values">
                    <div class="hp-controls">
                        <button class="hp-decrease" data-id="${participant.id}"><i class="fas fa-minus"></i></button>
                        <span class="hp">${participant.currentHp}/${participant.maxHp}</span>
                        <button class="hp-increase" data-id="${participant.id}"><i class="fas fa-plus"></i></button>
                    </div>
                    <button class="delete-btn" data-id="${participant.id}"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
    }

    function addParticipantEventListeners() {
        document.querySelectorAll('.hp-decrease').forEach(btn => {
            btn.addEventListener('click', (e) => changeHp(parseInt(e.currentTarget.dataset.id), -1));
        });

        document.querySelectorAll('.hp-increase').forEach(btn => {
            btn.addEventListener('click', (e) => changeHp(parseInt(e.currentTarget.dataset.id), 1));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteParticipant(parseInt(e.currentTarget.dataset.id)));
        });
    }

    function changeHp(id, amount) {
        const participant = participants.find(p => p.id === id);
        if (!participant) return;

        participant.currentHp = Math.max(0, participant.currentHp + amount);

        if (participant.currentHp <= 0) {
            deleteParticipant(id);
        } else {
            renderList();
        }
    }

    function deleteParticipant(id) {
        const deletedIndex = participants.findIndex(p => p.id === id);
        participants = participants.filter(p => p.id !== id);

        checkRoundResetConditions();
        adjustCurrentTurnIndex(deletedIndex);

        renderList();
        updateCurrentTurnDisplay();
    }

    function checkRoundResetConditions() {
        if (participants.length === 0 ||
            !participants.some(p => p.type === 'player') ||
            !participants.some(p => p.type === 'enemy')) {
            roundCount = 1;
            roundCountDisplay.textContent = roundCount;
        }
    }

    function adjustCurrentTurnIndex(deletedIndex) {
        if (participants.length === 0) {
            currentTurnIndex = -1;
        } else if (currentTurnIndex > deletedIndex) {
            currentTurnIndex--;
        } else if (currentTurnIndex >= participants.length) {
            currentTurnIndex = 0;
        }
    }

    function nextTurn() {
        if (participants.length === 0) return;

        updateConditionsForCurrentParticipant();

        currentTurnIndex = (currentTurnIndex + 1) % participants.length;

        if (currentTurnIndex === 0) {
            roundCount++;
            roundCountDisplay.textContent = roundCount;
        }

        checkRoundResetConditions();
        renderList();
        updateCurrentTurnDisplay();
    }

    function updateConditionsForCurrentParticipant() {
        if (currentTurnIndex >= 0 && currentTurnIndex < participants.length) {
            const participant = participants[currentTurnIndex];
            participant.conditions = participant.conditions
                .map(c => ({ ...c, duration: c.duration - 1 }))
                .filter(c => c.duration > 0);
        }
    }

    function updateCurrentTurnDisplay() {
        if (participants.length === 0) {
            currentTurnDisplay.textContent = '-';
            currentActiveParticipant = null;
            showNoActiveParticipantMessage();
            return;
        }

        currentActiveParticipant = participants[currentTurnIndex];
        currentTurnDisplay.textContent = `${currentActiveParticipant.name} (${currentActiveParticipant.initiative})`;
        renderCurrentUnitConditions();
        loadNotesForCurrentUnit();
    }

    function renderCurrentUnitConditions() {
        if (!currentActiveParticipant || currentActiveParticipant.conditions.length === 0) {
            currentUnitConditions.innerHTML = '<p>Нет активных состояний</p>';
            return;
        }

        currentUnitConditions.innerHTML = currentActiveParticipant.conditions
            .map(c => `
                <div class="condition-item">
                    <span>${c.name} (${c.duration} ход${getRussianPlural(c.duration)})</span>
                    <i class="fas fa-times remove-condition" data-condition="${c.name}"></i>
                </div>
            `).join('');

        document.querySelectorAll('.remove-condition').forEach(icon => {
            icon.addEventListener('click', (e) => {
                removeConditionFromCurrentUnit(e.target.dataset.condition);
            });
        });
    }

    function loadNotesForCurrentUnit() {
        if (!currentActiveParticipant) {
            unitNotes.value = '';
            return;
        }
        unitNotes.value = currentActiveParticipant.notes || '';
    }

    function saveNotesForCurrentUnit() {
        if (!currentActiveParticipant) return;
        currentActiveParticipant.notes = unitNotes.value;
    }

    function getRussianPlural(number) {
        return number % 10 === 1 && number % 100 !== 11 ? '' :
               number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20) ? 'а' : 'ов';
    }

    function showNoActiveParticipantMessage() {
        currentUnitConditions.innerHTML = '<p>Выберите участника</p>';
        unitNotes.value = '';
    }

    function addConditionToCurrentUnit() {
        if (!currentActiveParticipant) {
            alert('Нет активного участника!');
            return;
        }

        const conditionName = conditionSelect.value;
        const duration = parseInt(conditionDuration.value);

        if (!conditionName || isNaN(duration)) {
            alert('Выберите состояние и укажите длительность!');
            return;
        }

        const existingIndex = currentActiveParticipant.conditions.findIndex(c => c.name === conditionName);
        if (existingIndex >= 0) {
            currentActiveParticipant.conditions[existingIndex].duration = duration;
        } else {
            currentActiveParticipant.conditions.push({
                name: conditionName,
                duration: duration
            });
        }

        renderCurrentUnitConditions();
        conditionSelect.value = '';
        conditionDuration.value = '1';
    }

    function removeConditionFromCurrentUnit(conditionName) {
        if (!currentActiveParticipant) return;

        currentActiveParticipant.conditions = currentActiveParticipant.conditions
            .filter(c => c.name !== conditionName);

        renderCurrentUnitConditions();
    }
});
