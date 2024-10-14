let mainLogJSON = [];
let ConsoleLogLogPartRegEx = "";
const CURRENTDATE = new Date();
let FONTSIZE = 18;
let ISTEXTBOLD = false;

document.getElementById('filterButton').addEventListener('click', ApplyFilters);
document.getElementById('fontSizeTextButton').addEventListener('click', ApplyFontSize);
document.getElementById('showBoldCheckbox').addEventListener('change', function(event){MakeTextBold()})


function ReadLogFile() {
    mainLogJSON = [];
    ConsoleLogLogPartRegEx = "";
    if(isLogTypeSelected()){
        alert("ОШИБКА: Тип лога не выбран. Выберите тип лога и загрузите повторно.");
        return;
    }
    document.getElementById('logContainer').innerHTML = `<p style='color: white'>Чтение лога...</p>`
    HandleFileSelect();
}
// Функция обработки загрузки файла
function HandleFileSelect() {
    const file = document.getElementById("logFileInput").files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        let content = e.target.result;
        PrepareLog(content);
    };
    reader.readAsText(file);
}
function PrepareLog(content){
    let logTmp = content.split(/\r?\n/);

    let logType = GetLogTypeFromInterface();
    if(logType == null){
        alert("Тип лога не выбран. Выберите тип лога и загрузите повторно.");
        return;
    }

    logTmp.forEach( line => {
        let newLine = ParseLogGetDateAndText(line,logType);
        if (newLine != null){
            if(newLine.Text != null && newLine.Text.length > 0){
                let action = IdentifyLineType(newLine.Text);
                let textToChan = ConvertToChatView(action, newLine.Text);
                mainLogJSON.push({
                    "Action": action,
                    "Content": newLine.Text,
                    "Parse": textToChan,
                    "Date": new Date(newLine.Date)
                })
            }
        }
    });

    DisplayLog(mainLogJSON);
}
// Функция для отображения строк логов
function DisplayLog(content) {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = ''; // Очищаем контейнер
    

    // Показывать время или нет
    let applyTimestamp = document.getElementById('showTimeCheckbox').checked;

    // Добавляем каждую строку как отдельный элемент
    if(applyTimestamp){
        content.forEach((line, index) => {
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<button onclick="DeleteLineFromLog('log-${index}')" style='font-size: ${FONTSIZE}px;'">X</button><span style="color: white">${line.Date.toLocaleString()} - </span> ${line.Parse}`;
            logEntry.id = `log-${index}`; 
            logContainer.appendChild(logEntry);
        });
    }
    else{
        content.forEach((line, index) => {
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<button onclick="DeleteLineFromLog('log-${index}')" style='font-size: ${FONTSIZE}px;'">X</button> ${line.Parse}`;
            logEntry.id = `log-${index}`; 
            logContainer.appendChild(logEntry);
        });
    }
}
// Функция для фильтрации строк по фильтрам
function ApplyFilters() {
    // Ключевые слова
    const keywordsInput = document.getElementById('keywordsInput').value;
    const keywords = keywordsInput.trim().split(',').map(word => word.trim()); 

    let _localObject = mainLogJSON;
    if (keywords.length === 0 || keywords[0] === '') {
        console.log('No keywords or issue')
    }else{
        _localObject = mainLogJSON.filter(line => 
            keywords.some(keyword => line.Content.includes(keyword))
        );
    }

    // Времени
    let startTime = document.getElementById('timeLogFilterStart').value
    let endTime = document.getElementById('timeLogFilterEnd').value
    let dateTimeParse = startTime.length > 1 || endTime.length > 1;
    
    if(dateTimeParse){
        startTime = startTime.length > 1 ? new Date(startTime) : new Date("1998");
        endTime = endTime.length > 1 ? new Date(endTime) : new Date();

        _localObject = _localObject.filter(line => 
            (line.Date > startTime) && (line.Date < endTime)
        );
        
    }
    
    // Проверка дополнительных отключений в чате
    let disableOOCchat = document.getElementById('filterOOCChatCheckbox').checked;
    let disableADDchat = document.getElementById('filterADDskaCheckbox').checked;
    let disableSMSchat = document.getElementById('filterSMSCheckbox').checked;
    
    let checkAction = disableOOCchat || disableADDchat;
    if(checkAction){
        _localObject = _localObject.filter(line => {
            if (disableOOCchat && line.Action === 'OOCChat') return false;
            if (disableADDchat && line.Action === 'ADDska') return false;
            if (disableSMSchat && line.Action === 'SMS')  return false;
            return true;
        });
    }

    DisplayLog(_localObject);
}
// Функция для удаления строки с лога
function DeleteLineFromLog(id){
    let rowToDelete = document.getElementById(id);
    if(rowToDelete == null){
        alert('Element not found');
    }
    rowToDelete.remove();
}

// Функция определяет тип лога, устанавливает глобальный парс лога (параметры времени и даты)
// Возвращает тип лога (full/short)
function GetLogTypeFromInterface(){
    let fullLogElement = document.getElementById("full-log-radio");
    let shortLogElement =  document.getElementById("short-log-radio");

    if(!fullLogElement.checked && !shortLogElement.checked){

        return null
    }else{

        if(fullLogElement.checked){
            ConsoleLogLogPartRegEx = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[Output\] : \[\d{2}:\d{2}:\d{2}\] (.+)$/;
            
            return fullLogElement.value;
        }else{
            ConsoleLogLogPartRegEx = /^\[(\d{2}:\d{2}:\d{2})\] (.+)$/;
            
            return shortLogElement.value;
        }
    }
}
// Функция проверяет выбран ли какой-то тип лога
function isLogTypeSelected(){
    let fullLogElement = document.getElementById("full-log-radio");
    let shortLogElement =  document.getElementById("short-log-radio");

    return !fullLogElement.checked && !shortLogElement.checked
}
// Изменяет параметр fontSize для лога и кнопок.
function ApplyFontSize() {
    const fontSizeValue = document.getElementById('fontSizeTextLlb').value;

    if (!isNaN(fontSizeValue) && fontSizeValue > 0) {
        document.getElementById('logContainer').style.fontSize = fontSizeValue + 'px';

        const buttons = document.querySelectorAll('#logContainer button');
        buttons.forEach(button => {
            button.style.fontSize = (fontSizeValue - 5) + 'px';
        });
        
        FONTSIZE = fontSizeValue - 5;

    } else {
        alert('Введите корректное число в пикселях');
    }
}
// Функция, соотвественно логу, парсит строку в нужный тип данных.
// Возвращает объект:
// Date: DateTime
// Text: String
function ParseLogGetDateAndText(logEntry,logType) {
    let regex = ConsoleLogLogPartRegEx;

    // Применяем регулярное выражение к строке
    let match = logEntry.match(regex);

    if (match) {
        if(logType == "full"){
            return {
                Date: match[1],    // Первая часть - дата
                Text: match[2]     // Вторая часть - текст после времени
            };
        }else{
            let year = CURRENTDATE.getFullYear();
            let month = String(CURRENTDATE.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
            let day = String(CURRENTDATE.getDate()).padStart(2, '0');
        
            let formattedLog = `${year}-${month}-${day} ${match[1]}`;
            return {
                Date: formattedLog,    // Первая часть - дата
                Text: match[2]     // Вторая часть - текст после времени
            };
        }

    } else {
        return null;  // Если формат не совпал
    }
}

function MakeTextBold(){
    let checkboxValue = document.getElementById('showBoldCheckbox').checked;
    if(ISTEXTBOLD == checkboxValue) return;
    ISTEXTBOLD = checkboxValue;

    if(ISTEXTBOLD){
        document.getElementById('logContainer').style.fontWeight = "bold";
        return;
    }

    document.getElementById('logContainer').style.fontWeight = "normal";
    return;

}

// Функция определяет тип лога
function IdentifyLineType(line){
    switch(true){
        case regEx_ToDo_Pattern(line):
            return "TODO";
        case regEx_Do_Pattern(line):
                return "DO";
        case regEx_Whisper_Pattern(line):
                return "WHISPER";
        case regEx_Text_Pattern(line):
            return "TEXT";
        case regEx_OOC_Chat_Pattern(line):
            return "OOCChat";
        case regEx_RadioContactLocal_Pattern(line):
            return "RCLocal";
        case regEx_RadioContactGeneral_Pattern(line):
            return "RCGeneral";
        case regEx_RadioDepartment_Pattern(line):
            return "DepRADIO";
        case regEx_Advertise_Pattern(line):
            return "ADDska";
        case regEx_SMS_Pattern(line):
            return "SMS";
        case regEx_Scream_Pattern(line):
            return "Scream";
        case regEx_News_Pattern(line):
            return "News";
        case regEx_Megaphone_Pattern(line):
            return "Megaphone";
        case regEx_Phone_Pattern(line):
            return "Phone";
        case regEx_NewsRadio_Pattern(line):
            return "NewsRadio"
        case regEx_PrivateRadio_Pattern(line):
            return "PrivateRadio"
        default:
            return "ME";
    }
}
// Функция конвертирует сроку в отображаемый на странице элемент.
function ConvertToChatView(action, line){
    switch(action){
        case "TODO":
            let regexM= /- сказал \w+_\w+,/;
            let regexW = /- сказала \w+_\w+,/;
            let regexToDo = regexW.test(line) ? regexW : regexM;

            let ToDoName = regexToDo.exec(line)[0];
            let spliterToDo = line.split(regexToDo);
            let ToDofinal = `<span class='ToDoText'>${spliterToDo[0]}</span><span class='ToDoAction'>${ToDoName} ${spliterToDo[1]}</span>`
            return ToDofinal;
        case "DO":
            let regexDo = /^\(\( \w+_\w+ \[\d+\] \)\)/;
            let doName = regexDo.exec(line)[0];
            let doText = line.split(regexDo)[1];
            let finalDo = `<span class='doName'>${doName}</span><span class='doText'>${doText}</span>`
            return finalDo;
        case "WHISPER":
            let newLineWisp = `<span class='Whisper'> ${line} </span>`;
            return newLineWisp;
        case "TEXT":
            let newLineText = `<span class='justText'> ${line} </span>`;
            return newLineText;
        case "ME":
            let newLineMe = `<span class='meAction'> ${line} </span>`;
            return newLineMe;
        case "OOCChat":
            let newLineOOCChat = `<span class='oocChat'> ${line} </span>`;
            return newLineOOCChat;
        case "RCLocal":
            let newLineFRADIOL = `<span class='RCLocal'> ${line} </span>`;
            return newLineFRADIOL;
        case "RCGeneral":
            let newLineFRADIO = `<span class='RCGeneral'> ${line} </span>`;
            return newLineFRADIO;
        case "DepRADIO":
            let newLineDepRadio = `<span class='DepRADIO'> ${line} </span>`;
            return newLineDepRadio;
        case "ADDska":
            return `<span class='ADDska'> ${line} </span>`;
        case "SMS":
            return `<span class='SMS'> ${line} </span>`;
        case "Scream":
            return `<span class='Scream'> ${line} </span>`;
        case "News":
            return `<span class='News'> ${line} </span>`;
        case "Megaphone":
            return `<span class='SMS'> ${line} </span>`;
        case "Phone":
            return `<span class='Phone'> ${line} </span>`;
        case "NewsRadio":
            return `<span class='NewsRadio'> ${line} </span>`;
        case "PrivateRadio":
            return `<span class='PrivateRadio'> ${line} </span>`;
        default:
            return line;
    }
}


function regEx_Text_Pattern(logEntry) {
    const regex = /^\w+_\w+ \[\d+\]:/;
    return regex.test(logEntry);
}

function regEx_Whisper_Pattern(logEntry) {
    const regex = /^\w+_\w+ \[\d+\] шепчет:/;
    return regex.test(logEntry);
}

function regEx_Do_Pattern(logEntry) {
    const regex = /^\(\( \w+_\w+ \[\d+\] \)\)/;
    return regex.test(logEntry);
}

function regEx_Me_Pattern(logEntry) {
    const regex = /^\w+_\w+ /;
    return regex.test(logEntry);
}

function regEx_OOC_Chat_Pattern(logEntry) {
    const regex = /\(\(\s([A-Za-z]+_[A-Za-z]+)\s\[(\d+)\]\s:\s(.+?)\s\)\)/;;
    return regex.test(logEntry);
}

function regEx_ToDo_Pattern(logEntry) {
    const regexM = /- сказал \w+_\w+,/;
    const regexW = /- сказала \w+_\w+,/;
    let rezult = regexW.test(logEntry) || regexM.test(logEntry);
    return rezult;
}

function regEx_RadioContactLocal_Pattern(logEntry){
    const regex = /^\[RR\]:\s*(.+)/;
    return regex.test(logEntry);
}

function regEx_RadioContactGeneral_Pattern(logEntry){
    const regex = /^\[R\]:\s*(.+)/;
    return regex.test(logEntry);
}

function regEx_RadioDepartment_Pattern(logEntry){
    const regex = /^\[D\]:\s*(.+)/;
    return regex.test(logEntry);
}

function regEx_Advertise_Pattern(logEntry){
    const regex1 = /^\[Объявление\]:\s*(.+)/;
    const regex2 = /Отредактировал сотрудник/;
    let rez = regex1.test(logEntry) || regex2.test(logEntry)
    return rez;
}

function regEx_SMS_Pattern(logEntry){
    let regex = /SMS (от|для) ([A-Za-z]+_[A-Za-z]+) \[(\d+)\]/;
    let rez = regex.test(logEntry)
    return rez;
}

function regEx_Scream_Pattern(logEntry){
    let regex = /^([A-Za-z]+_[A-Za-z]+) \[(\d+)\] кричит: (.+)/;
    let rez = regex.test(logEntry)
    return rez;
}

function regEx_News_Pattern(logEntry){
    let regex = /^\[Новости\]:\s*(.+)/;;
    let rez = regex.test(logEntry)
    return rez;
}

function regEx_Megaphone_Pattern(logEntry){
    let regex = /^Мегафон: ([A-Za-z]+_[A-Za-z]+) \[(\d+)\] : (.+)/;
    let rez = regex.test(logEntry)
    return rez;
}

function regEx_Phone_Pattern(logEntry){
    let regex = /^\[Телефон\] ([A-Za-z]+_[A-Za-z]+) \[(\d+)\]: (.+)/;
    let rez = regex.test(logEntry)
    return rez;
}

function regEx_NewsRadio_Pattern(logEntry){
    let regex = /^\[Радио (LSNEWS|LVNEWS)\] ([A-Za-z]+_[A-Za-z]+): (.+)/;
    let rez = regex.test(logEntry)
    return rez;
}

function regEx_PrivateRadio_Pattern(logEntry){
    let regex = /^\[R1 F:(1000|[1-9][0-9]{3})\]: ([A-Za-z]+_[A-Za-z]+): (.+)/;
    let rez = regex.test(logEntry)
    return rez;
}
