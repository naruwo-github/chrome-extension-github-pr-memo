const getPrKey = () => location.pathname;

const DEFAULT_CHECKLIST_ITEMS = [
  { text: "この変更が解決する問題は？", checked: false },
  { text: "この関数の任された役割は？一言で", checked: false },
  { text: "Coding Policyに違反してない？", checked: false },
  { text: "このコード、他のどこに影響及ぼしそう？", checked: false },
  { text: "半年後見たとき、理解できなそうなとこは？", checked: false },
];

const loadChecklist = async () => {
  const key = getPrKey();
  const data = await chrome.storage.local.get(key);
  if (data[key] === undefined) {
    await saveChecklist(DEFAULT_CHECKLIST_ITEMS);
    return DEFAULT_CHECKLIST_ITEMS;
  }
  return data[key];
};

const saveChecklist = async (checklist) => {
  const key = getPrKey();
  await chrome.storage.local.set({ [key]: checklist });
};

const renderChecklistItem = (item, index) => {
  const li = document.createElement('li');
  li.dataset.index = index;
  li.innerHTML = `
    <input type="checkbox" ${item.checked ? 'checked' : ''}>
    <input type="text" value="${item.text}">
    <button class="delete-memo-item">X</button>
  `;
  return li;
};

const renderChecklist = async () => {
  const checklistEl = document.getElementById('pr-memo-checklist');
  if (!checklistEl) return;

  const checklist = await loadChecklist();
  checklistEl.innerHTML = '';
  checklist.forEach((item, index) => {
    const li = renderChecklistItem(item, index);
    checklistEl.appendChild(li);
  });
};

const createMemoUI = () => {
  if (document.getElementById('pr-memo-container')) return;

  const sidebar = document.getElementById('partial-discussion-sidebar');
  if (!sidebar) return;

  const container = document.createElement('div');
  container.id = 'pr-memo-container';
  container.innerHTML = `
    <div class="discussion-sidebar-item">
        <h2 class="gh-header-title">Review Checklist 👀 🚨</h2>
        <ul id="pr-memo-checklist"></ul>
        <button id="add-memo-item" class="btn btn-sm btn-block mt-2">Add Item</button>
    </div>
  `;
  sidebar.prepend(container);

  renderChecklist();

  const checklistEl = document.getElementById('pr-memo-checklist');
  const addItemBtn = document.getElementById('add-memo-item');

  addItemBtn.addEventListener('click', async () => {
    const checklist = await loadChecklist();
    checklist.push({ text: '', checked: false });
    await saveChecklist(checklist);
    renderChecklist();
  });

  checklistEl.addEventListener('change', async (e) => {
    const target = e.target;
    const li = target.closest('li');
    if (!li) return;
    const index = parseInt(li.dataset.index);
    const checklist = await loadChecklist();

    if (target.type === 'checkbox') {
      checklist[index].checked = target.checked;
    } else if (target.type === 'text') {
      checklist[index].text = target.value;
    }
    await saveChecklist(checklist);
  });

  checklistEl.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-memo-item')) {
          const li = e.target.closest('li');
          if (!li) return;
          const index = parseInt(li.dataset.index);
          let checklist = await loadChecklist();
          checklist.splice(index, 1);
          await saveChecklist(checklist);
          renderChecklist();
      }
  });
};


const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && (node.id === 'partial-discussion-sidebar' || node.querySelector('#partial-discussion-sidebar'))) {
                createMemoUI();
                return;
            }
        }
    }
});


const mainContent = document.querySelector('main');
if (mainContent) {
    observer.observe(mainContent, { childList: true, subtree: true });
}

createMemoUI();
