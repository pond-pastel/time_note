let data;
let isSupportedWakeLock = false;
let wakeLock = null;
let showData = {
    key: undefined,
    type: undefined
};
let isTimerPlayings = {};
let modalDisabled = [];
let modalNotFocus = [];

function dataSave() {
    localStorage.setItem("time_note", JSON.stringify(data));
}

function dataApply() {
    const d = localStorage.getItem("time_note");
    if(d) {
        data = JSON.parse(d);
    } else {
        data = {};
        tableApply();
        return;
    }
    tableApply();
    timerApply();
    timeApply();
    tagUseApply();
    lapApply();
    const timer = data.timerList;
    if(timer === undefined) {
        return;
    }
    Object.keys(timer).forEach((k) => {
        const v = data.timerList[k];
        if(v.startDate !== undefined && v.currentTime === undefined) {
            timerSet(k);
        }
    });
}

function isWakeLockSupported() {
    const notAutoSleepEle = document.querySelector("#not-auto-sleep");
    if("wakeLock" in navigator) {
        isSupportedWakeLock = true;
        notAutoSleepEle.classList.add("footer");
    } else {
        isSupportedWakeLock = false;
        notAutoSleepEle.classList.remove("footer");
        notAutoSleepEle.disabled = true;
    }
}

async function autoSleepDisabled(e) {
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        confirmAndCheck(e);
    } catch {
        toast("自動スリープの無効化に失敗しました。");
    }
}

function autoSleepEnable() {
    wakeLock.release().then(() => {
        wakeLock = null;
    });
}

function confirmAndCheck(e) {
    e.checked = true;
}

function inputDisabled() {
    const enables = document.querySelectorAll("button:not(:disabled),input:not(:disabled)");
    enables.forEach((e) => {
        modalDisabled.push(e);
        e.disabled = true;
    });
    const notFocus = document.querySelectorAll("*[tabindex='0'],a");
    notFocus.forEach((n) => {
        modalNotFocus.push(n);
        n.tabIndex = "-1";
    });
}

function inputEnable() {
    modalDisabled.forEach((d) => {
        d.disabled = false;
    });
    modalNotFocus.forEach((n) => {
        n.tabIndex = "0";
    });
    modalDisabled = [];
    modalNotFocus = [];
}

function toast(s, f, a) {
    inputDisabled();
    const toastEle = document.querySelector("#toast");
    if(toastEle) {
        toastEle.remove();
    }
    const modal = document.createElement("div");
    modal.id = "modal";
    const t = document.createElement("div");
    t.textContent = s;
    t.id = "toast";
    const buttonBox = document.createElement("p");
    buttonBox.classList.add("button-group");
    buttonBox.id = "toast-button-group";
    const okButton = document.createElement("button");
    okButton.textContent = "OK";
    okButton.classList.add("ok-button");
    if(typeof f === "function") {
        okButton.addEventListener("click", () => {
            if(typeof a === "object") {
                f(...a);
            } else {
                f();
            }
            removeToast();
        })
        const cancelButton = document.createElement("button");
        cancelButton.textContent = "キャンセル";
        cancelButton.classList.add("cancel-button");
        cancelButton.addEventListener("click", () => {
            removeToast();
        });
        buttonBox.append(cancelButton);
    } else {
        okButton.addEventListener("click", () => {
            removeToast();
        });
    }
    buttonBox.append(okButton);
    t.append(buttonBox);
    modal.append(t);
    document.body.append(modal);
}

function removeToast() {
    inputEnable();
    const modal = document.querySelector("#modal");
    if(modal) {
        modal.remove();
    }
}

function removeMenu() {
    const blur = document.querySelector("#blur");
    blur.remove();
    inputEnable();
}

function switchView(e) {
    const radio = document.querySelector(`#${e.dataset.status}-status`);
    radio.checked = true;
}

function adjustTheDigits(s, n) {
    if(String(s).length >= n) {
        return String(s).slice(0, n);
    } else {
        let result = "";
        for(let i = 0;i < n - String(s).length;i++) {
            result += "0";
        }
        result += String(s);
        return result;
    }
}

function tableApply() {
    const tableBox = document.querySelector("#table-box");
    tableBox.innerHTML = "";
    const record = data.recordList;
    if(Object.keys(record).length < 1) {
        const h3 = document.createElement("h3");
        h3.textContent = "記録がありません。";
        tableBox.append(h3);
        return;
    }
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = "クリックで詳細を確認・編集";
    table.append(caption);
    const thead = document.createElement("thead");
    const checkboxList = ["#show-date", "#show-timer-name", "#show-time", "#show-lap", "#show-tag"];
    const thList = ["日付", "ストップウォッチの名前", "タイム", "ラップ", "タグ"];
    const thTr = document.createElement("tr");
    checkboxList.forEach((c, i) => {
        const checkbox = document.querySelector(c);
        if(checkbox.checked) {
            const th = document.createElement("th");
            th.textContent = thList[i];
            if(i === 0) {
                th.classList.add("date-th");
            }
            thTr.append(th);
        }
    });
    thead.append(thTr);
    table.append(thead);
    const tbody = document.createElement("tbody");
    Object.keys(record).forEach((rk) => {
        const keys = Object.keys(record[rk]);
        const showDateEle = document.querySelector("#show-date");
        if(showDateEle.checked) {
            const tdTr = document.createElement("tr");
            const th = document.createElement("th");
            th.textContent = returnDate(rk);
            th.rowSpan = `${keys.length + 1}`;
            th.tabIndex = "0";
            th.classList.add("date-th");
            th.addEventListener("click", () => {
                showDetails(rk, "date");
            });
            tdTr.append(th);
            tbody.append(tdTr);
        }
        const trList = [];
        keys.forEach((k, i) => {
            trList.push(document.createElement("tr"));
            const r = record[rk][k];
            let title = "";
            const showTimerNameEle = document.querySelector("#show-timer-name");
            if(showTimerNameEle.checked) {
                const td = document.createElement("td");
                title += `名前: ${r.name}`;
                td.textContent = r.name;
                trList[i].append(td);
            }
            const showTimeEle = document.querySelector("#show-time");
            if(showTimeEle.checked) {
                const td = document.createElement("td");
                title += `タイム: ${returnTime(r.time)}`;
                td.textContent = returnTime(r.time);
                trList[i].append(td);
            }
            const showLapEle = document.querySelector("#show-lap");
            if(showLapEle.checked) {
                const td = document.createElement("td");
                if(r.lapList.length === 0) {
                    title += "ラップはありません。";
                    td.append("-");
                } else {
                    const ol = document.createElement("ol");
                    r.lapList.forEach((l, i) => {
                        const li = document.createElement("li");
                        title += `ラップ${i + 1}: ${returnTime(l)}`;
                        li.textContent = returnTime(l);
                        ol.append(li);
                    });
                    td.append(ol);
                }
                trList[i].append(td);
            }
            const showTagEle = document.querySelector("#show-tag");
            if(showTagEle.checked) {
                const td = document.createElement("td");
                if(r.tagList.length === 0) {
                    title += "タグはありません。";
                    td.append("-");
                } else {
                    r.tagList.forEach((t, i) => {
                        title += `タグ${i + 1}: ${t}`;
                        const tag = document.createElement("span");
                        tag.classList.add("tag");
                        tag.textContent = t;
                        td.append(tag);
                    });
                }
                trList[i].append(td);
            }
            trList[i].title = title;
            trList[i].tabIndex = "0";
            trList[i].addEventListener("click", () => {
                showDetails(k, "timer");
            });
        });
        trList.forEach((t) => {
            tbody.append(t);
        });
    });
    table.append(tbody);
    tableBox.append(table);
}

function showDetails(k, t) {
    showData.key = k;
    showData.type = t;
    const blurEle = document.getElementById("blur");
    if(blurEle) {
        blurEle.remove();
    }
    const blur = document.createElement("div");
    blur.id = "blur";
    const menu = document.createElement("div");
    menu.id = "menu";
    inputDisabled();
    const timer = (t === "date" ? data.recordList[k] : Object.values(data.recordList).find(record => k in record)[k]);
    const h2 = document.createElement("h2");
    h2.classList.add("details-title");
    const leftButton = document.createElement("button");
    leftButton.classList.add("left-button");
    leftButton.addEventListener("click", () => {
        turningPages(t, k, "left");
    });
    h2.append(leftButton);
    h2.append(t === "date" ? returnDate(Object.keys(timer)[0]) : timer.name);
    const rightButton = document.createElement("button");
    rightButton.classList.add("right-button");
    rightButton.addEventListener("click", () => {
        turningPages(t, k, "right");
    });
    h2.append(rightButton);
    menu.append(h2);
    if(t === "date") {
        Object.keys(timer).forEach((k) => {
            timerDataApply(timer[k], k);
        });
    } else {
        timerDataApply(timer);
    }
    function timerDataApply(timerData, key) {
        if(t === "date") {
            const name = document.createElement("h2");
            name.textContent = timerData.name;
            menu.append(name);
        }
        const time = document.createElement("div");
        const timeTitle = document.createElement("h3");
        timeTitle.textContent = "タイム";
        time.append(timeTitle);
        const tm = document.createElement("div");
        tm.textContent = returnTime(timerData.time);
        time.append(tm);
        menu.append(time);
        if(timerData.lapList.length > 0) {
            const lap = document.createElement("div");
            const lapTitle = document.createElement("h3");
            lapTitle.textContent = "ラップ";
            lap.append(lapTitle);
            const ol = document.createElement("ol");
            timerData.lapList.forEach((l) => {
                const li = document.createElement("li");
                li.textContent = returnTime(l);
                ol.append(li);
            });
            lap.append(ol);
            menu.append(lap);
        }
        const tag = document.createElement("div");
        const tagTitle = document.createElement("h3");
        tagTitle.textContent = "タグ";
        tag.append(tagTitle);
        if(timerData.tagList.length > 0) {
            const tagList = document.createElement("div");
            tagList.classList.add("tag-list");
            timerData.tagList.forEach((tg, i) => {
                const tag = document.createElement("button");
                tag.classList.add("tag");
                tag.textContent = tg;
                tag.addEventListener("click", () => {
                    toast(`${tg}をこのストップウォッチから削除しますか？`, recordTagRemove, [(t === "date" ? timerData : k), tg, t, (t === "date" ? k : null)]);
                });
                tagList.append(tag);
            });
            tag.append(tagList);
        } else {
            tag.append("タグはありません。");
        }
        const tagSelect = document.createElement("select");
        tagSelect.id = "record-tag-add-select";
        tagSelect.addEventListener("change", () => {
            recordTagAdd((t === "date" ? timerData : k), tagSelect.value, t, t === "date" ? k : null);
        });
        const dfOp = document.createElement("option");
        dfOp.textContent = "このストップウォッチにタグを追加";
        dfOp.value = "";
        dfOp.disabled = true;
        dfOp.selected = true;
        tagSelect.append(dfOp);
        (data.tag ?? []).forEach((t) => {
            if(!timerData.tagList.some((tg) => tg === t)) {
                const op = document.createElement("option");
                op.textContent = t;
                op.value = t;
                tagSelect.append(op);
            }
        });
        tag.append(tagSelect);
        menu.append(tag);
        const buttonGroup = document.createElement("p");
        buttonGroup.classList.add("button-group");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "このストップウォッチを削除";
        deleteButton.addEventListener("click", () => {
            toast("本当にこのストップウォッチを削除しますか？", deleteTimer, [(t === "date" ? key : k)]);
        });
        buttonGroup.append(deleteButton);
        menu.append(buttonGroup);
    }
    const buttonGroup = document.createElement("p");
    buttonGroup.classList.add("button-group");
    const closeButton = document.createElement("button");
    closeButton.textContent = "とじる";
    closeButton.addEventListener("click", () => {
        removeMenu();
    });
    buttonGroup.append(closeButton);
    menu.append(buttonGroup);
    blur.append(menu);
    document.body.append(blur);
}

function deleteTimer(k) {
    let target;
    const norm = Object.keys(data.recordList);
    let i = 0;
    norm.forEach((n) => {
        const record = Object.keys(data.recordList[n]).filter((key => key === k));
        if(record.length > 0) {
            target = n;
        }
    });
    delete data.recordList[target][k];
    if(Object.keys(Array(data.recordList[target])[0]).length === 0) {
        delete data.recordList[target];
    }
    tableApply();
    removeMenu();
    dataSave();
}

function turningPages(t, k, d) {
    let pages;
    let index;
    let turningId = (d === "left" ? -1 : 1);
    if(t === "date") {
        pages = Object.keys(data.recordList);
        index = pages.findIndex((i) => i === k);
    } else {
        pages = [];
        Object.keys(data.recordList).forEach((r) => {
            Object.keys(data.recordList[r]).forEach((i) => {
                pages.push(i);
            });
        });
        index = pages.findIndex((i) => i === k);
    }
    index += turningId;
    if(index < 0) {
        index = (pages.length - 1);
    } else if(index >= pages.length) {
        index = 0;
    }
    showDetails(pages[index], t);
}

function returnDate(d) {
    const date = new Date(Number(d));
    let result = "";
    result += `${date.getFullYear()}/${adjustTheDigits(date.getMonth() + 1, 2)}/${adjustTheDigits(date.getDate(), 2)}`;
    return result;
}

function timerAdd() {
    if(data.timerList === undefined) {
        data.timerList = {};
        timeUpdate();
    }
    const newKey = String(Date.now());
    data.timerList[newKey] = {};
    timerNameSave(`ストップウォッチ${returnDate(newKey).replaceAll("/", "-")}`, newKey);
    timerApply();
    dataSave();
}

function timerApply() {
    const timerListEle = document.querySelector("#timer-list");
    timerListEle.innerHTML = "";
    const timer = data.timerList;
    if(timer === undefined) {
        tagApply();
        tagSelectApply();
        tagUseApply();
        lapApply();
        return;
    }
    Object.keys(timer).forEach((k) => {
        const v = data.timerList[k];
        isTimerPlayings[k] = Boolean(v.currentTime === undefined);
        const timer = document.createElement("div");
        timer.id = `timer-${k}`;
        timer.append("ストップウォッチの名前:");
        const input = document.createElement("input");
        input.id = `name-input-${k}`;
        input.type = "text";
        input.value = v.name ?? `ストップウォッチ${returnDate(k).replaceAll("/", "-")}`;
        input.placeholder = `ストップウォッチ${returnDate(k).replaceAll("/", "-")}`;
        input.addEventListener("change", () => {
            timerNameSave(input.value, k);
        });
        timer.append(input);
        const useTagList = document.createElement("div");
        useTagList.classList.add("use-tag-list");
        useTagList.id = `use-tag-list-${k}`;
        if((data.tag ?? []).length > 0) {
            const tagSelect = document.createElement("select");
            tagSelect.classList.add("tag-select");
            tagSelect.id = `tag-select-${k}`;
            tagSelect.addEventListener("change", () => {
                tagUse(tagSelect.value, k);
                tagSelect.value = "";
            });
            timer.append(tagSelect);
        }
        timer.append(useTagList);
        const currentTime = document.createElement("div");
        currentTime.id = `current-time-${k}`;
        currentTime.innerHTML = `現在のタイム: <span>${returnTime((v.currentTime ?? 0))}</span>`;
        timer.append(currentTime);
        const lapList = document.createElement("div");
        lapList.id = `lap-list-${k}`;
        timer.append(lapList);
        const playButtonBox = document.createElement("div");
        const playButton = document.createElement("button");
        playButton.id = `play-button-${k}`;
        playButton.textContent = "開始";
        playButton.addEventListener("click", () => {
            timerSet(k);
        });
        playButton.style.display = "none";
        playButtonBox.append(playButton);
        timer.append(playButtonBox);
        const controlContent = document.createElement("div");
        controlContent.id = `control-content-${k}`;
        const lapButton = document.createElement("button");
        lapButton.id = `lap-button-${k}`;
        lapButton.textContent = "ラップ";
        lapButton.addEventListener("click", () => {
            lap(k);
        });
        controlContent.append(lapButton);
        const playPauseButton = document.createElement("button");
        playPauseButton.id = `play-pause-button-${k}`;
        playPauseButton.textContent = isTimerPlayings[k] ? "停止" : "再開";
        playPauseButton.addEventListener("click", () => {
            timerPlayPause(k);
        });
        controlContent.append(playPauseButton);
        const saveButton = document.createElement("button");
        saveButton.id = `save-button-${k}`;
        saveButton.textContent = "記録";
        saveButton.addEventListener("click", () => {
            recordSave(k);
        });
        controlContent.append(saveButton);
        const cancelButton = document.createElement("button");
        cancelButton.id = `cancel-button-${k}`;
        cancelButton.textContent = "削除";
        cancelButton.addEventListener("click", () => {
            timerCancel(k);
        });
        controlContent.append(cancelButton);
        timer.append(controlContent);
        timerListEle.append(timer);
        if(Boolean(v.currentTime === undefined && v.startDate === undefined)) {
            playButton.style.display = null;
            controlContent.style.display = "none";
        }
    });
    tagApply();
    tagSelectApply();
    tagUseApply();
    lapApply();
}

function timerCancel(k) {
    if(isTimerPlayings[k]) {
        timerPlayPause(k);
    }
    toast(`本当に${data.timerList[k].name}を削除しますか？`, removeTimer, [k]);
}

function removeTimer(k) {
    delete data.timerList[k];
    const timerEle = document.querySelector(`#timer-${k}`);
    timerEle.remove();
    delete isTimerPlayings[k];
    dataSave();
    lapApply();
    tagUseApply();
    timerApply();
}

function returnTime(t) {
    let timeMs = t;
    let time = "";
    if(timeMs >= 3600000) {
        const h = (timeMs - (timeMs % 3600000));
        timeMs -= h;
        time += `${h / 3600000}:`;
    }
    const m = (timeMs - (timeMs % 60000));
    timeMs -= m;
    const s = (timeMs - (timeMs % 1000));
    timeMs -= s;
    const ms = timeMs;
    time += `${adjustTheDigits(m / 60000, 2)}:${adjustTheDigits(s / 1000, 2)}.${adjustTheDigits(adjustTheDigits(ms, 3), 2)}`;
    return time;
}

function timerNameSave(n, k) {
    const timer = data.timerList[k];
    if(timer === undefined) {
        return;
    }
    const name = (/^\s*$/.test(n)) ? `ストップウォッチ${returnDate(k).replaceAll("/", "-")}` : n;
    data.timerList[k].name = name;
    dataSave();
}

function timeApply() {
    const timer = data.timerList;
    if(timer === undefined) {
        return;
    }
    Object.keys(timer).forEach((k) => {
        const currentTimeEle = document.querySelector(`#current-time-${k} span`);
        const v = data.timerList[k];
        if(v.satartDate === undefined && v.currentTime === undefined) {
            currentTimeEle.textContent = "00:00.00";
            isTimerPlayings[k] = false;
            return;
        }
        currentTimeEle.textContent = returnTime(v.currentTime ?? 0);
        const playButtonEle = document.querySelector(`#play-button-${k}`);
        playButtonEle.style.display = "none";
        const controlContentEle = document.querySelector(`#control-content-${k}`);
        controlContentEle.style.display = null;
        if(v.currentTime !== undefined) {
            const playPauseButtonEle = document.querySelector(`#play-pause-button-${k}`);
            playPauseButtonEle.textContent = "再開";
        } else {
            isTimerPlayings[k] = true;
        }
    });
}

function timerSet(k) {
    if(data.timerList === undefined) {
        data.timerList = {};
        timeUpdate();
    }
    const timer = data.timerList[k];
    if(timer.startDate === undefined) {
        data.timerList[k].startDate = Date.now();
        dataSave();
    } else if(timer.currentTime !== undefined) {
        data.timerList[k].startDate = Date.now() - data.timerList[k].currentTime;
    }
    const playButtonEle = document.querySelector(`#play-button-${k}`);
    playButtonEle.style.display = "none";
    const controlContentEle = document.querySelector(`#control-content-${k}`);
    controlContentEle.style.display = null;
    isTimerPlayings[k] = true;
    timerApply();
}

function timeUpdate() {
    const timer = data.timerList;
    if(timer === undefined) {
        return;
    }
    Object.keys(timer).forEach((k) => {
        if(!isTimerPlayings[k]) {
            return;
        }
        const currentTimeEle = document.querySelector(`#current-time-${k} span`);
        currentTimeEle.textContent = returnTime(timer[k].startDate === undefined ? 0 : Date.now() - timer[k].startDate);
    });
    requestAnimationFrame(timeUpdate);
}

function lap(k) {
    const timer = data.timerList[k];
    if(timer.lapList === undefined) {
        data.timerList[k].lapList = [];
    }
    data.timerList[k].lapList.push(timer.currentTime ?? Date.now() - timer.startDate + (timer.currentTime ?? 0));
    dataSave();
    lapApply();
}

function lapApply() {
    const timer = data.timerList;
    if(timer === undefined) {
        return;
    }
    Object.keys(timer).forEach((k) => {
        const v = data.timerList[k];
        const lapListEle = document.querySelector(`#lap-list-${k}`);
        lapListEle.innerHTML = "";
        if(v.lapList === undefined) {
            return;
        }
        v.lapList.forEach((l, i) => {
            const lap = document.createElement("div");
            lap.textContent = `Lap${i + 1}: ${returnTime(l)}`;
            lapListEle.append(lap);
        });
    });
}

function timerPlayPause(k) {
    const playPauseButtonEle = document.querySelector(`#play-pause-button-${k}`);
    const timer = data.timerList[k];
    if(isTimerPlayings[k]) {
        playPauseButtonEle.textContent = "再開";
        if(timer.currentTime === undefined) {
            data.timerList[k].currentTime = Date.now() - data.timerList[k].startDate;
        } else {
            data.timerList[k].currentTime += Date.now() - data.timerList[k].startDate;
        }
        isTimerPlayings[k] = false;
    } else {
        playPauseButtonEle.textContent = "停止";
        data.timerList[k].startDate = Date.now() - data.timerList[k].currentTime;
        delete data.timerList[k].currentTime;
        timerSet(k);
    }
    dataSave();
}

function recordSave(k) {
    const timer = data.timerList[k];
    let record = timer.startDate - ((Number(timer.startDate) + 32400000) % 86400000);
    if(data.recordList === undefined) {
        data.recordList = {};
    }
    if(data.recordList[record] === undefined) {
        data.recordList[record] = {};
    }
    data.recordList[record][k] = {
        time: timer.currentTime ?? Date.now() - timer.startDate,
        lapList: timer.lapList ?? [],
        tagList: timer.useTagList ?? [],
        name: timer.name ?? `ストップウォッチ${returnDate(k).replaceAll("/", "-")}`
    };
    removeTimer(k);
    tableApply();
}

function recordTagAdd(k, tg, ty, lk) {
    const selectEle = document.getElementById("record-tag-add-select");
    selectEle.value = "";
    let timer;
    if(ty === "date") {
        timer = k;
    } else {
        timer = Object.values(data.recordList).find(record => k in record)[k];
    }
    if(timer.tagList.some((t) => t === tg)) {
        toast(`${tg}はすでに使用しています。`);
        return;
    }
    timer.tagList.push(tg);
    showDetails((ty === "date" ? lk : k), ty);
    tableApply();
    dataSave();
}

function recordTagRemove(k, tg, ty, lk) {
    let timer;
    if(ty === "date") {
        timer = k;
    } else {
        timer = Object.values(data.recordList).find(record => k in record)[k];
    }
    timer.tagList = timer.tagList.filter((t) => t !== tg);
    showDetails((ty === "date" ? lk : k), ty);
    tableApply();
    dataSave();
}

function allRecordTagRemove(t) {
    Object.keys(data.recordList).forEach((r) => {
        Object.keys(data.recordList[r]).forEach((k) => {
            data.recordList[r][k].tagList = data.recordList[r][k].tagList.filter((l) => l !== t);
        });
    });
}

function tagUse(t, k) {
    if(/^\s$/.test(t)) {
        toast("スペースのみのタグは使用できません。");
        return;
    }
    const timer = data.timerList[k];
    if(timer.useTagList !== undefined) {
        if(timer.useTagList.some((tag) => tag === t)) {
            toast(`${t}タグは既に使用しています。`);
            return;
        }
    } else {
        data.timerList[k].useTagList = [];
    }
    data.timerList[k].useTagList.push(t);
    dataSave();
    tagUseApply();
    tagSelectApply();
}

function tagUseApply() {
    const timer = data.timerList;
    if(timer === undefined) {
        return;
    }
    Object.keys(timer).forEach((k) => {
        const v = data.timerList[k];
        const useTagListEle = document.querySelector(`#use-tag-list-${k}`);
        if(v.useTagList === undefined || v.useTagList.length === 0) {
            useTagListEle.innerHTML = "";
            return;
        } else {
            useTagListEle.innerHTML = "<b>使用しているタグ<span style='font-size: 0.8rem;font-weight: normal;'>(クリックでタグを外す)</span>: </b>";
        }
        v.useTagList.forEach((t) => {
            const tag = document.createElement("button");
            tag.addEventListener("click", () => {
                toast(`${t}タグを削除しますか？`, tagUseRemove, [t, k]);
            });
            tag.textContent = t;
            tag.classList.add("use-tag");
            tag.title = "クリックでタグを外す";
            useTagListEle.append(tag);
        });
    });
}

function tagUseRemove(t, k) {
    const timer = data.timerList[k];
    if(timer.useTagList !== undefined) {
        timer.useTagList = timer.useTagList.filter((tag) => tag !== t);
        dataSave();
        tagUseApply();
        tagSelectApply();
    }
}

function tagSelectApply() {
    function addOption(s, t) {
        const option = document.createElement("option");
        option.textContent = t;
        option.value = t;
        s.append(option);
    }
    if(!data.tag || data.timerList === undefined) {
        return;
    }
    Object.keys(data.timerList).forEach((k) => {
        const selectEle = document.querySelector(`#tag-select-${k}`);
        if(!selectEle) {
            return;
        }
        selectEle.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "使用するタグを選択";
        defaultOption.value = "";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectEle.append(defaultOption);
        data.tag.forEach((t) => {
            if(data.timerList[k].useTagList !== undefined) {
                if(!data.timerList[k].useTagList.some((u) => u === t)) {
                    addOption(selectEle, t);
                }
            } else {
                addOption(selectEle, t);
            }
        });
    });
}

function tagApply() {
    if(!data.tag) {
        return;
    }
    const tagListEle = document.querySelector("#tag-list");
    tagListEle.innerHTML = "";
    data.tag.forEach((t) => {
        const tag = document.createElement("button");
        tag.textContent = t;
        tag.classList.add("tag");
        tag.addEventListener("click", () => {
            toast(`${t}タグを削除しますか？過去のタグや使用中のタグも削除されます。`, tagRemove, [t]);
        })
        tagListEle.append(tag);
    });
}

function tagRemove(t) {
    const timer = data.timerList;
    if(data.tag === undefined) {
        return;
    }
    data.tag = data.tag.filter((tag) => tag !== t);
    if(timer === undefined) {
        dataSave();
        tagApply();
        tagSelectApply();
        tableApply();
        return;
    }
    Object.keys(timer).forEach((k) => {
        tagUseRemove(t, k);
    });
    allRecordTagRemove(t);
    dataSave();
    tagApply();
    tagSelectApply();
    tableApply();
    if((data.tag ?? []).length === 0) {
        timerApply();
    }
}

function tagAddInit() {
    const blur = document.createElement("div");
    blur.id = "blur";
    const menu = document.createElement("div");
    menu.id = "menu";
    const title = document.createElement("h1");
    title.textContent = "タグを追加";
    menu.append(title);
    const inp = document.createElement("input");
    inp.type = "text";
    inp.id = "new-tag-name-inp";
    const inpDiv = document.createElement("div");
    inpDiv.textContent = "タグ名:";
    inpDiv.append(inp);
    menu.append(inpDiv);
    const buttonGroup = document.createElement("p");
    buttonGroup.classList.add("button-group");
    const doneButton = document.createElement("button");
    doneButton.textContent = "+追加";
    doneButton.addEventListener("click", () => {
        tagAdd();
    });
    buttonGroup.append(doneButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "×キャンセル";
    cancelButton.addEventListener("click", () => {
        removeMenu();
    });
    buttonGroup.append(cancelButton);
    menu.append(buttonGroup);
    blur.append(menu);
    document.body.append(blur);
}

function tagAdd() {
    const tagName = document.querySelector("#new-tag-name-inp");
    if(/^\s*$/.test(tagName.value)) {
        tagName.value = "";
        toast("タグ名を入力してください。");
        return;
    }
    if(data.tag !== undefined) {
        if(data.tag.some((t) => t === tagName.value)) {
            toast(`${tagName.value}は既に存在しています。別の名前を登録してください。`);
            tagName.value = "";
            return;
        }
    } else {
        data.tag = [];
    }
    data.tag.push(tagName.value);
    tagApply();
    timerApply();
    tagSelectApply();
    dataSave();
    removeMenu();
}

function showHiddenFooter(t) {
    const showFooterEle = document.querySelector("#show-footer");
    if(t === "click") {
        showFooterEle.checked = !showFooterEle.checked;
    }
}

window.onload = function() {
    isWakeLockSupported();
    dataApply();
    const statusButtonEles = document.querySelectorAll(".status-button");
    statusButtonEles.forEach((b) => {
        b.addEventListener("click", () => {
            switchView(b);
        });
    });
    const tagAddButtonEle = document.querySelector("#new-tag-add-button");
    tagAddButtonEle.addEventListener("click", () => {
        tagAddInit();
    });
    const timerAddButtonEle = document.querySelector("#timer-add-button");
    timerAddButtonEle.addEventListener("click", () => {
        timerAdd();
    });
    const footerButtonEle = document.querySelector("#footer-button");
    footerButtonEle.addEventListener("click", () => {
        showHiddenFooter("click");
    });
    const showSettingEles = document.querySelectorAll(".show-setting");
    showSettingEles.forEach((s) => {
        s.addEventListener("change", () => {
            tableApply();
        });
    });
    const showSettingDisabledEles = document.querySelectorAll("label:has(.show-setting:disabled)");
    showSettingDisabledEles.forEach((s) => {
        s.addEventListener("click", () => {
            toast("この項目は変更できません。");
        });
    });
    const notAutoSleepEle = document.querySelector("#not-auto-sleep");
    notAutoSleepEle.addEventListener("click",(e) => {
        if(notAutoSleepEle.checked) {
            toast("この項目をONにするとバッテリー消費量が増える可能性があります。それでもONにしますか？", autoSleepDisabled, [notAutoSleepEle]);
            e.preventDefault();
        } else {
            autoSleepEnable();
        }
    });
    timeUpdate();
}

window.addEventListener("pageshow", () => {
    showHiddenFooter("pageshow");
});