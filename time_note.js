const exampleTags = ["勉強", "運動", "掃除", "料理", "読書"];
let data;
let searchData;
let searching = false;
let searchCriteria = {};
let searchTag = [];
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

function settingsSave() {
    if(!data.settings) {
        data.settings = {};
    }
    const showDateEle = document.getElementById("show-date");
    const showTimerNameEle = document.getElementById("show-timer-name");
    const showTimeEle = document.getElementById("show-time");
    const showLapEle = document.getElementById("show-lap");
    const showTagEle = document.getElementById("show-tag");
    const modeEle = document.getElementById("appearance-mode");
    data.settings.showDate = showDateEle.checked;
    data.settings.showTimerName = showTimerNameEle.checked;
    data.settings.showTime = showTimeEle.checked;
    data.settings.showLap = showLapEle.checked;
    data.settings.showTag = showTagEle.checked;
    data.settings.modeInversion = modeEle.checked;
    dataSave();
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
    settingsApply();
    tableApply();
    timerApply();
    timeApply();
    tagUseApply();
    lapApply();
    const timer = data.timerList;
    if(timer !== undefined) {
        Object.keys(timer).forEach((k) => {
            const v = data.timerList[k];
            if(v.startDate !== undefined && v.currentTime === undefined) {
                timerSet(k);
            }
        });
    }
    if(data.tab !== undefined) {
        const radio = document.querySelector(`#${data.tab}-status`);
        if(radio) {
            radio.checked = true;
        }
    }
}

function settingsApply() {
    if(data.settings) {
        const showDateEle = document.getElementById("show-date");
        const showTimerNameEle = document.getElementById("show-timer-name");
        const showTimeEle = document.getElementById("show-time");
        const showLapEle = document.getElementById("show-lap");
        const showTagEle = document.getElementById("show-tag");
        const modeEle = document.getElementById("appearance-mode");
        showDateEle.checked = data.settings.showDate ?? true;
        showTimerNameEle.checked = data.settings.showTimerName ?? true;
        showTimeEle.checked = data.settings.showTime ?? true;
        showLapEle.checked = data.settings.showLap ?? true;
        showTagEle.checked = data.settings.showTag ?? true;
        modeEle.checked = data.settings.modeInversion ?? false;
    }
}

function takeOffFocus() {
    const focusedEle = document.querySelector("input[type='text']:focus");
    if(focusedEle) {
        focusedEle.blur();
    }
}

function convertTimeToNumber(t) {
    return ((parseInt(Number(t[0])) * 3600 + parseInt(Number(t[1])) * 60 + parseFloat(Number(t[2]))) * 1000);
}

function isWakeLockSupported() {
    const notAutoSleepEle = document.querySelector("#not-auto-sleep");
    if(!"wakeLock" in navigator) {
        notAutoSleepEle.disabled = true;
    }
}

async function autoSleepDisabled(e) {
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        if(e) {
            confirmAndCheck(e);
        }
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
    const enables = document.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled)");
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

function showMenu() {
    const blur = document.createElement("div");
    blur.id = "blur";
    const menu = document.createElement("div");
    menu.id = "menu";
    inputDisabled();
    return [blur, menu];
}

function removeMenu() {
    const blur = document.querySelector("#blur");
    if(blur) {
        blur.remove();
    }
    inputEnable();
}

function switchView(e) {
    const radio = document.querySelector(`#${e.dataset.status}-status`);
    radio.checked = true;
    data.tab = e.dataset.status;
    switch(e.dataset.status) {
        case "input":
            if(data.tutorial.create === false) {
                data.tutorial.create = true;
            }
            break;
        case "view":
            if(data.tutorial.record === false) {
                data.tutorial.record = true;
            }
            break;
    }
    tutorialStart();
    dataSave();
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
    const record = searchData ?? data.recordList;
    if(!record) {
        const h3 = document.createElement("h3");
        h3.textContent = "記録がありません。";
        tableBox.append(h3);
        return;
    }
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
            th.role = "button";
            th.addEventListener("click", () => {
                showDetails(rk, "date");
            });
            th.addEventListener("keydown", (e) => {
                if(e.key === "Enter" || e.key === " ") {
                    th.click();
                }
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
            trList[i].role = "button";
            trList[i].addEventListener("click", () => {
                showDetails(k, "timer");
            });
            trList[i].addEventListener("keydown", (e) => {
                if(e.key === "Enter" || e.key === " ") {
                    trList[i].click();
                }
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
    const record = searchData ?? data.recordList;
    if(!record) {
        return;
    }
    showData.key = k;
    showData.type = t;
    const blurEle = document.getElementById("blur");
    if(blurEle) {
        blurEle.remove();
    }
    const [blur, menu] = showMenu();
    const timer = (t === "date" ? record[k] : Object.values(record).find(record => k in record)[k]);
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
    if(searchData && t === "date") {
        const note = document.createElement("p");
        note.textContent = "検索条件に一致しないストップウォッチは非表示になっています。";
        menu.append(note);
    }
    if(t === "date") {
        Object.keys(timer).forEach((k) => {
            timerDataApply(timer[k], k);
        });
        const total = document.createElement("h3");
        total.textContent = totalTime();
        menu.append(total);
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
        const selectBox = document.createElement("p");
        const tagSelect = document.createElement("select");
        tagSelect.name = "record-tag-add-select";
        tagSelect.addEventListener("change", () => {
            recordTagAdd((t === "date" ? timerData : k), tagSelect.value, t, t === "date" ? k : null, tagSelect);
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
        selectBox.append(tagSelect);
        tag.append(selectBox);
        menu.append(tag);
        const nameChangeGroup = document.createElement("p");
        nameChangeGroup.classList.add("button-group");
        const nameChangeButton = document.createElement("button");
        nameChangeButton.textContent = "名前を変更";
        nameChangeButton.addEventListener("click", () => {
            changeTimerName(k, t, nameChangeGroup, (t === "date" ? timerData : k));
        });
        nameChangeGroup.append(nameChangeButton);
        menu.append(nameChangeGroup);
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
    function totalTime() {
        if(t !== "date") {
            return "合計時間の処理でエラーが発生しました。";
        }
        const time = searchData ?? data.recordList;
        let total = 0;
        Object.keys(time[k]).forEach((t) => {
            total += data.recordList[k][t].time;
        });
        return `合計: ${returnTime(total)}`;
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

function changeTimerName(k, t, g, key) {
    g.innerHTML = "";
    const input = document.createElement("input");
    input.type = "text";
    input.name = "new-timer-name";
    const button = document.createElement("button");
    button.textContent = "完了";
    button.addEventListener("click", () => {
        let timer;
        if(t === "date") {
            timer = key;
        } else {
            timer = Object.values(data.recordList).find(record => key in record)[key];
        }
        timerNameApply(k, t, timer, input);
    });
    g.append(input);
    g.append(button);
}

function timerNameApply(k, t, timer, i) {
    const n = i.value
    if(/^\s*$/.test(n)) {
        toast("この名前は使用できません。");
        i.value = "";
        return;
    }
    timer.name = n;
    showDetails(k, t);
    search();
    tableApply();
    dataSave();
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
    search();
    tableApply();
    removeMenu();
    dataSave();
}

function turningPages(t, k, d) {
    let pages;
    let index;
    let turningId = (d === "left" ? -1 : 1);
    if(t === "date") {
        pages = Object.keys(searchData ?? data.recordList);
        index = pages.findIndex((i) => i === k);
    } else {
        pages = [];
        Object.keys(searchData ?? data.recordList).forEach((r) => {
            Object.keys(searchData ? searchData[r] : data.recordList[r]).forEach((i) => {
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
    timerNameSave("", newKey);
    timerApply();
    if(data.tutorial.stopwatch === false) {
        data.tutorial.stopwatch = true;
    }
    tutorialStart();
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
        const timer = document.createElement("p");
        timer.id = `timer-${k}`;
        timer.append("ストップウォッチの名前:");
        const input = document.createElement("input");
        input.id = `name-input-${k}`;
        input.type = "text";
        input.value = v.name !== "" ? v.name ?? "" : "";
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
    data.timerList[k].name = n;
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
        name: timer.name === "" ? `ストップウォッチ${returnDate(k).replaceAll("/", "-")}`: timer.name ?? timer.name
    };
    removeTimer(k);
    search();
    tableApply();
}

function recordTagAdd(k, tg, ty, lk, s) {
    s.value = "";
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
    search();
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
    search();
    tableApply();
    dataSave();
}

function allRecordTagRemove(t) {
    if(data.recordList === undefined) {
        return;
    }
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
    const nameEle = document.getElementById(`name-input-${k}`);
    if(nameEle.value === "") {
        nameEle.value = t;
        timerNameSave(t, k);
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
    const nameEle = document.getElementById(`name-input-${k}`);
    if(nameEle.value === t) {
        if(timer.useTagList.length > 0) {
            nameEle.value = timer.useTagList[0];
        } else {
            nameEle.value = "";
        }
    }
    timerNameSave(nameEle.value, k);
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
        search();
        tableApply();
        return;
    }
    Object.keys(timer).forEach((k) => {
        tagUseRemove(t, k);
    });
    searchTag = searchTag.filter((tg) => t !== tg);
    allRecordTagRemove(t);
    dataSave();
    tagApply();
    tagSelectApply();
    search();
    tableApply();
    if((data.tag ?? []).length === 0) {
        timerApply();
    }
}

function tagAddInit() {
    const [blur, menu] = showMenu();
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
    const tagExamplesTitle = document.createElement("div");
    tagExamplesTitle.textContent = "タグの例(クリックで追加できます。)";
    const tagList = document.createElement("div");
    tagList.classList.add("tag-list");
    let noTags = true;
    exampleTags.forEach((t) => {
        if(!(data.tag ?? []).some((tg) => tg === t)) {
            noTags = false;
            const tag = document.createElement("button");
            tag.classList.add("tag");
            tag.textContent = t;
            tag.addEventListener("click", () => {
                tagAdd(t);
            });
            tagList.append(tag);
        }
    });
    if(!noTags) {
        menu.append(tagExamplesTitle);
        menu.append(tagList);
    }
    blur.append(menu);
    document.body.append(blur);
}

function tagAdd(n) {
    const tagName = document.querySelector("#new-tag-name-inp");
    const name = n ?? tagName.value;
    if(/^\s*$/.test(name)) {
        tagName.value = "";
        toast("タグ名を入力してください。");
        return;
    }
    if(data.tag !== undefined) {
        if(data.tag.some((t) => t === name)) {
            toast(`${name}タグは既に存在しています。別の名前を登録してください。`);
            tagName.value = "";
            return;
        }
    } else {
        data.tag = [];
    }
    data.tag.push(name);
    tagApply();
    timerApply();
    tagSelectApply();
    removeMenu();
    if(data.tutorial.tag === false) {
        data.tutorial.tag = true;
    }
    tutorialStart();
    dataSave();
}

function showHiddenFooter(t) {
    const showFooterEle = document.querySelector("#show-footer");
    if(t === "click") {
        showFooterEle.checked = !showFooterEle.checked;
    }
}

function searchSelectTagApply(s) {
    s.innerHTML = "";
    const dfOpt = document.createElement("option");
    dfOpt.textContent = "タグを選択してください。";
    dfOpt.value = "";
    dfOpt.selected = true;
    dfOpt.disabled = true;
    s.append(dfOpt);
    (data.tag ?? []).forEach((t) => {
        if(!searchTag.some((tg) => tg === t)) {
            const opt = document.createElement("option");
            opt.textContent = t;
            opt.value = t;
            s.append(opt);
        }
    });
}

function searchPopup() {
    if(data.recordList === undefined) {
        toast("記録がある時のみこの機能が使用できます。");
        return;
    }
    if(Object.keys(data.recordList).length === 0) {
        toast("記録を全て削除した後、この機能を使用するにはもう一度記録を作成する必要があります。");
        return;
    }
    const [blur, menu] = showMenu();
    const title = document.createElement("h3");
    title.textContent = "検索";
    const questionButton = document.createElement("button");
    questionButton.textContent = "？";
    questionButton.id = "search-question-button";
    questionButton.addEventListener("click", () => {
        toast("タグの検索はOR検索になります。名前は一部でも一致していれば検索されます。日付、タイム、ラップは指定した範囲内で検索されます。検索方式はAND検索とOR検索から選べます。2つ入力欄がある項目はどちらか1つでも入力されていれば検索されます。ストップウォッチの追加や編集、削除、タグの削除をした場合、再検索されます。");
    });
    title.append(questionButton);
    menu.append(title);
    const dateInputP = document.createElement("p");
    dateInputP.textContent = "日付で検索:";
    const dateInputFrom = document.createElement("input");
    dateInputFrom.type = "date";
    dateInputFrom.id = "search-date-input-from";
    dateInputFrom.value = searchCriteria.dateFrom ?? "";
    dateInputP.append(dateInputFrom);
    dateInputP.append(" ~ ");
    const dateInputTo = document.createElement("input");
    dateInputTo.type = "date";
    dateInputTo.id = "search-date-input-to";
    dateInputTo.value = searchCriteria.dateTo ?? "";
    dateInputP.append(dateInputTo);
    menu.append(dateInputP);
    const nameInputP = document.createElement("p");
    nameInputP.textContent = "名前で検索: ";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = "search-name-input";
    nameInput.value = searchCriteria.name ?? "";
    nameInputP.append(nameInput);
    menu.append(nameInputP);
    const timeInputP = document.createElement("p");
    timeInputP.textContent = "タイムで検索: ";
    const timeInputFromH = document.createElement("input");
    timeInputFromH.type = "number";
    timeInputFromH.min = "0";
    timeInputFromH.id = "search-time-input-from-h";
    timeInputFromH.value = searchCriteria.timeFromH ?? "";
    timeInputP.append(timeInputFromH);
    timeInputP.append("時間");
    const timeInputFromM = document.createElement("input");
    timeInputFromM.type = "number";
    timeInputFromM.min = "0";
    timeInputFromM.max = "59";
    timeInputFromM.id = "search-time-input-from-m";
    timeInputFromM.value = searchCriteria.timeFromM ?? "";
    timeInputP.append(timeInputFromM);
    timeInputP.append("分");
    const timeInputFromS = document.createElement("input");
    timeInputFromS.type = "number";
    timeInputFromS.min = "0";
    timeInputFromS.max = "59";
    timeInputFromS.id = "search-time-input-from-s";
    timeInputFromS.value = searchCriteria.timeFromS ?? "";
    timeInputP.append(timeInputFromS);
    timeInputP.append("秒 ~ ");
    const timeInputToH = document.createElement("input");
    timeInputToH.type = "number";
    timeInputToH.min = "0";
    timeInputToH.id = "search-time-input-to-h";
    timeInputToH.value = searchCriteria.timeToH ?? "";
    timeInputP.append(timeInputToH);
    timeInputP.append("時間");
    const timeInputToM = document.createElement("input");
    timeInputToM.type = "number";
    timeInputToM.min = "0";
    timeInputToM.max = "59";
    timeInputToM.id = "search-time-input-to-m";
    timeInputToM.value = searchCriteria.timeToM ?? "";
    timeInputP.append(timeInputToM);
    timeInputP.append("分");
    const timeInputToS = document.createElement("input");
    timeInputToS.type = "number";
    timeInputToS.min = "0";
    timeInputToS.max = "59";
    timeInputToS.id = "search-time-input-to-s";
    timeInputToS.value = searchCriteria.timeToS ?? "";
    timeInputP.append(timeInputToS);
    timeInputP.append("秒");
    menu.append(timeInputP);
    const lapInputP = document.createElement("p");
    lapInputP.textContent = "ラップで検索: ";
    const lapInputFrom = document.createElement("input");
    lapInputFrom.type = "number";
    lapInputFrom.min = "0";
    lapInputFrom.id = "search-lap-input-from";
    lapInputFrom.value = searchCriteria.lapFrom ?? "";
    lapInputP.append(lapInputFrom);
    lapInputP.append("個 ~ ");
    const lapInputTo = document.createElement("input");
    lapInputTo.type = "number";
    lapInputTo.min = "0";
    lapInputTo.id = "search-lap-input-to";
    lapInputTo.value = searchCriteria.lapTo ?? "";
    lapInputP.append(lapInputTo);
    lapInputP.append("個");
    menu.append(lapInputP);
    const select = document.createElement("select");
    select.id = "search-tag-select";
    searchSelectTagApply(select);
    select.addEventListener("change", () => {
        searchTagAdd();
        searchSelectTagApply(select);
    });
    menu.append(select);
    const usedTag = document.createElement("div");
    usedTag.classList.add("tag-list");
    usedTag.id = "used-tag";
    menu.append(usedTag);
    const searchMethodP = document.createElement("p");
    searchMethodP.textContent = "検索方式: ";
    const searchMethodSelect = document.createElement("select");
    searchMethodSelect.id = "search-method-select";
    const andOpt = document.createElement("option");
    andOpt.textContent = "AND検索";
    andOpt.value = "and";
    searchMethodSelect.append(andOpt);
    const orOpt = document.createElement("option");
    orOpt.textContent = "OR検索";
    orOpt.value = "or";
    searchMethodSelect.append(orOpt);
    searchMethodSelect.value = searchCriteria.searchMethod ?? "and";
    searchMethodP.append(searchMethodSelect);
    menu.append(searchMethodP);
    const searchCriteriaClearButtonP = document.createElement("p");
    searchCriteriaClearButtonP.classList.add("button-group");
    const searchCriteriaClearButton = document.createElement("button");
    searchCriteriaClearButton.textContent = "×検索条件リセット";
    searchCriteriaClearButton.addEventListener("click", () => {
        toast("本当に検索条件をリセットしますか？", searchCriteriaClear);
    });
    searchCriteriaClearButtonP.append(searchCriteriaClearButton);
    menu.append(searchCriteriaClearButtonP);
    const buttonGroup = document.createElement("p");
    buttonGroup.classList.add("button-group");
    const searchButton = document.createElement("button");
    searchButton.textContent = "☌検索";
    searchButton.addEventListener("click", () => {
        searching = true;
        search();
    });
    buttonGroup.append(searchButton);
    if(searchData) {
        const searchClearButton = document.createElement("button");
        searchClearButton.textContent = "×検索解除";
        searchClearButton.addEventListener("click", () => {
            searchClear();
        });
        buttonGroup.append(searchClearButton);
    }
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "×キャンセル";
    cancelButton.addEventListener("click", () => {
        removeMenu();
    });
    buttonGroup.append(cancelButton);
    menu.append(buttonGroup);
    blur.append(menu);
    document.body.append(blur);
    searchTagAdd();
    const searchCriteriaEles = menu.querySelectorAll("input, select");
    searchCriteriaEles.forEach((e) => {
        e.addEventListener("change", () => {
            searchCriteriaSave();
        });
    });
}

function searchTagAdd() {
    const s = document.getElementById("search-tag-select");
    const v = s.value;
    s.value = "";
    if(searchTag.some((t) => t === v)) {
        toast("そのタグは選択済みです。");
        return;
    }
    if(v) {
        searchTag.push(v);
    }
    usedTagApply();
}

function usedTagApply() {
    const usedTagEle = document.getElementById("used-tag");
    usedTagEle.innerHTML = "";
    searchTag.forEach((t) => {
        const button = document.createElement("button");
        button.textContent = t;
        button.classList.add("tag");
        button.addEventListener("click", () => {
            toast(`${t}タグを検索から除外しますか？`, usedTagRemove, [t]);
        });
        usedTagEle.append(button);
    });
}

function usedTagRemove(t) {
    searchTag = searchTag.filter((tg) => tg !== t);
    usedTagApply();
}

function search() {
    if(!searching) {
        return;
    }
    searchData = {};
    Object.keys(data.recordList).forEach((r) => {
        Object.keys(data.recordList[r]).forEach((t) => {
            let and = true;
            let or = false;
            if(searchTag.length > 0) {
                if(data.recordList[r][t].tagList.length < 1) {
                    and = false;
                }
                let yes = false;
                data.recordList[r][t].tagList.forEach((tg) => {
                    if(searchTag.some((tag) => tag === tg)) {
                        yes = true;
                    }
                });
                if(yes) {
                    or = true;
                } else {
                    and = false;
                }
            }
            let dateFrom = Date.parse(searchCriteria.dateFrom);
            let dateTo = Date.parse(searchCriteria.dateTo);
            const date = Number(r) + 32400000;
            if(!isNaN(dateFrom) && !isNaN(dateTo)) {
                if(dateFrom > dateTo) {
                    const box = dateFrom;
                    dateFrom = dateTo;
                    dateTo = box;
                }
                if(dateFrom <= date && date <= dateTo) {
                    or = true;
                } else {
                    and = false;
                }
            } else if(isNaN(dateTo) && !isNaN(dateFrom)) {
                if(dateFrom <= date) {
                    or = true;
                } else {
                    and = false;
                }
            } else if(isNaN(dateFrom) && !isNaN(dateTo)) {
                if(dateTo >= date) {
                    or = true;
                } else {
                    and = false;
                }
            }
            const name = searchCriteria.name;
            if(name) {
                if(data.recordList[r][t].name.includes(name)) {
                    or = true;
                } else {
                    and = false;
                }
            }
            let timeFrom = convertTimeToNumber([searchCriteria.timeFromH ?? "", searchCriteria.timeFromM ?? "", searchCriteria.timeFromS ?? ""]);
            let timeTo = convertTimeToNumber([searchCriteria.timeToH ?? "", searchCriteria.timeToM ?? "", searchCriteria.timeToS ?? ""]);
            const time = data.recordList[r][t].time;
            if(timeFrom && timeTo) {
                if(timeFrom > timeTo) {
                    const box = timeFrom;
                    timeFrom = timeTo;
                    timeTo = box;
                }
                if(timeFrom <= time && time <= timeTo) {
                    or = true;
                } else {
                    and = false;
                }
            } else if(!timeTo && timeFrom) {
                if(timeFrom <= time) {
                    or = true;
                } else {
                    and = false;
                }
            } else if(!timeFrom && timeTo) {
                if(timeTo >= time) {
                    or = true;
                } else {
                    and = false;
                }
            }
            let lapFrom = String(searchCriteria.lapFrom ?? "");
            let lapTo = String(searchCriteria.lapTo ?? "");
            const lap = data.recordList[r][t].lapList.length;
            if(lapFrom !== "" && lapTo !== "") {
                lapFrom = Number(lapFrom);
                lapTo = Number(lapTo);
                if(lapFrom > lapTo) {
                    const box = lapFrom;
                    lapFrom = lapTo;
                    lapTo = box;
                }
                if(lapFrom <= lap && lap <= lapTo) {
                    or = true;
                } else {
                    and = false;
                }
            } else if(lapTo === "" && lapFrom !== "") {
                lapFrom = Number(lapFrom);
                lapTo = Number(lapTo);
                if(lapFrom <= lap) {
                    or = true;
                } else {
                    and = false;
                }
            } else if(lapFrom === "" && lapTo !== "") {
                lapFrom = Number(lapFrom);
                lapTo = Number(lapTo);
                if(lapTo >= lap) {
                    or = true;
                } else {
                    and = false;
                }
            }
            const searchMethod = searchCriteria.searchMethod ?? "and";
            if(searchMethod === "and" && and) {
                if(searchData[r] === undefined) {
                    searchData[r] = {};
                }
                searchData[r][t] = data.recordList[r][t];
            } else if(searchMethod === "or" && or) {
                if(searchData[r] === undefined) {
                    searchData[r] = {};
                }
                searchData[r][t] = data.recordList[r][t];
            }
        });
    });
    tableApply();
    removeMenu();
    const viewContentEle = document.getElementById("view-content");
    viewContentEle.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    searchCriteriaApply();
}

function searchCriteriaApply() {
    const c = searchCriteria;
    const criteriaEle = document.getElementById("search-criteria");
    criteriaEle.innerHTML = "";
    const title = document.createElement("h2");
    criteriaEle.append(title);
    title.textContent = "検索条件";
    if(c.dateFrom || c.dateTo) {
        const dateTitle = document.createElement("h3");
        dateTitle.textContent = "日付";
        criteriaEle.append(dateTitle);
        const date = document.createElement("p");
        date.textContent = `${(c.dateFrom ?? "").replaceAll("-", "/")} ~ ${(c.dateTo ?? "").replaceAll("-", "/")}`;
        criteriaEle.append(date);
    }
    if(c.name) {
        const nameTitle = document.createElement("h3");
        nameTitle.textContent = "名前";
        criteriaEle.append(nameTitle);
        const name = document.createElement("p");
        name.textContent = `${c.name}(部分一致)`;
        criteriaEle.append(name);
    }
    if(c.timeFromH || c.timeFromM || c.timeFromS || c.timeToH || c.timeToM || c.timeToS) {
        const timeTitle = document.createElement("h3");
        timeTitle.textContent = "時間";
        criteriaEle.append(timeTitle);
        const time = document.createElement("p");
        time.textContent = `${adjustTheDigits(c.timeFromH ?? "", 2)}:${adjustTheDigits(c.timeFromM ?? "", 2)}:${adjustTheDigits(c.timeFromS ?? "", 2)} ~ ${adjustTheDigits(c.timeToH ?? "", 2)}:${adjustTheDigits(c.timeToM ?? "", 2)}:${adjustTheDigits(c.timeToS ?? "", 2)}`;
        criteriaEle.append(time);
    }
    if(c.lapFrom || c.lapTo) {
        const lapTitle = document.createElement("h3");
        lapTitle.textContent = "ラップ";
        criteriaEle.append(lapTitle);
        const lap = document.createElement("p");
        lap.textContent = `${c.lapFrom}個 ~ ${c.lapTo}個`;
        criteriaEle.append(lap);
    }
    if(searchTag.length > 0) {
        const tagTitle = document.createElement("h3");
        tagTitle.textContent = "タグ(OR検索)";
        criteriaEle.append(tagTitle);
        const tag = document.createElement("p");
        tag.classList.add("tag-list");
        searchTag.forEach((t) => {
            const tg = document.createElement("span");
            tg.classList.add("tag");
            tg.textContent = t;
            tag.append(tg);
        });
        criteriaEle.append(tag);
    }
    const searchMethodTitle = document.createElement("h3");
    searchMethodTitle.textContent = "検索方式";
    criteriaEle.append(searchMethodTitle);
    const searchMethod = document.createElement("p");
    searchMethod.textContent = `${(searchCriteria.searchMethod ?? "and").toUpperCase()}検索`;
    criteriaEle.append(searchMethod);
    criteriaEle.style.display = null;
}

function searchCriteriaSave() {
    searchCriteria = {};
    const dateFromEle = document.getElementById("search-date-input-from");
    const dateToEle = document.getElementById("search-date-input-to");
    if(dateFromEle.value) {
        searchCriteria.dateFrom = dateFromEle.value;
    }
    if(dateToEle.value) {
        searchCriteria.dateTo = dateToEle.value;
    }
    const nameEle = document.getElementById("search-name-input");
    if(nameEle.value) {
        searchCriteria.name = nameEle.value;
    }
    const timeFromHEle = document.getElementById("search-time-input-from-h");
    const timeFromMEle = document.getElementById("search-time-input-from-m");
    const timeFromSEle = document.getElementById("search-time-input-from-s");
    const timeToHEle = document.getElementById("search-time-input-to-h");
    const timeToMEle = document.getElementById("search-time-input-to-m");
    const timeToSEle = document.getElementById("search-time-input-to-s");
    if(timeFromHEle.value) {
        searchCriteria.timeFromH = timeFromHEle.value;
    }
    if(timeFromMEle.value) {
        searchCriteria.timeFromM = timeFromMEle.value;
    }
    if(timeFromSEle.value) {
        searchCriteria.timeFromS = timeFromSEle.value;
    }
    if(timeToHEle.value) {
        searchCriteria.timeToH = timeToHEle.value;
    }
    if(timeToMEle.value) {
        searchCriteria.timeToM = timeToMEle.value;
    }
    if(timeToSEle.value) {
        searchCriteria.timeToS = timeToSEle.value;
    }
    const lapFromEle = document.getElementById("search-lap-input-from");
    const lapToEle = document.getElementById("search-lap-input-to");
    if(lapFromEle.value) {
        searchCriteria.lapFrom = lapFromEle.value;
    }
    if(lapToEle.value) {
        searchCriteria.lapTo = lapToEle.value;
    }
    const searchMethodSelectEle = document.getElementById("search-method-select");
    searchCriteria.searchMethod = searchMethodSelectEle.value;
}

function searchCriteriaClear() {
    seacrchCriteria = {};
    const initEles = document.querySelectorAll("#menu input[type='text'], #menu input[type='number'], #menu input[type='date']");
    initEles.forEach((e) => {
        e.value = "";
    });
    const timeEles = document.querySelectorAll("#menu input[type='time']");
    timeEles.forEach((e) => {
        e.value = "00:00:00";
    });
    const searchMethodSelectEle = document.getElementById("search-method-select");
    searchMethodSelectEle.value = "and";
    searchCriteria = {};
    searchTag = [];
    usedTagApply();
    const s = document.getElementById("search-tag-select");
    searchSelectTagApply(s);
}

function searchClear() {
    searchData = null;
    searching = false;
    const criteriaEle = document.getElementById("search-criteria");
    criteriaEle.innerHTML = "";
    criteriaEle.style.display = "none";
    removeMenu();
    tableApply();
}

function detailsShow(e) {
    const input = document.getElementById(e.dataset.v);
    input.checked = !input.checked;
}

function tutorialStart() {
    if(data.tutorial === undefined) {
        data.tutorial = {};
    }
    const tutorialEles = document.querySelectorAll(".tutorial");
    tutorialEles.forEach((t) => {
        t.style.display = null;
    });
    const tutorial = data.tutorial;
    if(!tutorial.create) {
        const createEle = document.getElementById("create-tutorial");
        createEle.style.display = "block";
        data.tutorial.create = false;
        return;
    }
    if(!tutorial.tag) {
        const tagEle = document.getElementById("tag-tutorial");
        tagEle.style.display = "block";
        data.tutorial.tag = false;
    }
    if(!tutorial.stopwatch) {
        const stopwatchEle = document.getElementById("stopwatch-tutorial");
        stopwatchEle.style.display = "block";
        data.tutorial.stopwatch = false;
        return;
    }
    if(data.recordList && !tutorial.record) {
        const recordEle = document.getElementById("record-tutorial");
        recordEle.style.display = "block";
        data.tutorial.record = false;
        return;
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
            settingsSave();
        });
    });
    const showSettingDisabledEles = document.querySelectorAll("label:has(.show-setting:disabled)");
    showSettingDisabledEles.forEach((s) => {
        s.addEventListener("click", () => {
            toast("この項目は変更できません。");
        });
    });
    const appearanceModeEle = document.getElementById("appearance-mode");
    appearanceModeEle.addEventListener("change", () => {
        settingsSave();
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
    const versitionLabels = document.querySelectorAll(".versition-button");
    versitionLabels.forEach((l) => {
        l.addEventListener("click", (e) => {
            detailsShow(l);
        });
    });
    const searchButtonEle = document.getElementById("search-button");
    searchButtonEle.addEventListener("click", () => {
        searchPopup();
    });
    timeUpdate();
    tutorialStart();
}

window.addEventListener("pageshow", () => {
    showHiddenFooter("pageshow");
});

window.addEventListener("visibilitychange", () => {
    const checkEle = document.getElementById("not-auto-sleep");
    if(document.visibilityState === "visible" && checkEle.checked) {
        autoSleepDisabled();
    }
});

window.addEventListener("keydown", (e) => {
    if(e.key === "Enter") {
        takeOffFocus();
    }
});