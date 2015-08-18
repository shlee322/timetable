var selectMouseData = {
    'selected': false,
    'day': -1,
    'y1': 0,
    'y2': 0,
    'y2_time': 0
};

function searchLectureByTime(time_1, time_2) {
    console.log(time_1, time_2);
}

function updateSelectMouseData() {
    if(!selectMouseData.selected) {
        return;
    }

    var y2_time = Math.floor(selectMouseData.y2/30);

    if(selectMouseData.y2_time == y2_time) return;
    selectMouseData.y2_time = y2_time;

    $('.timetable-time-col-div-1, .timetable-time-col-div-2').css('background-color', '');

    var time_1 = Math.min(Math.floor(selectMouseData.y1/30), Math.floor(selectMouseData.y2/30));
    var time_2 = Math.max(Math.floor(selectMouseData.y1/30), Math.floor(selectMouseData.y2/30));

    for(var i=time_1; i<=time_2; i++) {
        $('#timetable_time_col_' + selectMouseData.day  + '_timediv_' + i).css('background-color', '#F0F0F0');
    }

    Timetable.getInstance().searchLectureByTime(
        selectMouseData.day * 86400 + time_1 * 1800,
        selectMouseData.day * 86400 + time_2 * 1800 + 1800
    );
}

$(document).ready(function () {
    $('.timetable-table > .timetable-time-col').mousedown(function (event) {
        selectMouseData.selected = true;
        selectMouseData.day = Number($(event.toElement).parent('.timetable-time-col').data('day'));
        selectMouseData.y1 = event.pageY - 100;
        selectMouseData.y2 = event.pageY - 100;
        selectMouseData.y2_time = -1;

        if(selectMouseData.y1 < 0) selectMouseData.selected = false;

        updateSelectMouseData();
    });

    $('.timetable-table > .timetable-time-col').mousemove(function (event) {
        selectMouseData.y2 = event.pageY - 100;
        if(selectMouseData.y2 < 0) selectMouseData.y2 = 0;

        updateSelectMouseData();
    });

    $('.timetable-table > .timetable-time-col').mouseup(function () {
        selectMouseData.selected = false;
        $('.timetable-time-col-div-1, .timetable-time-col-div-2').css('background-color', '');
        updateSelectMouseData();
    });
});
