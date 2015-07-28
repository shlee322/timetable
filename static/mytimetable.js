function login_page() {
    $('#my_timetable_title').text('내 시간표 관리');
    $('#my_timetable_login').show();
    $('#my_timetable_list').hide();
}

function my_timetable_page() {
    Kakao.API.request({
        url: '/v1/user/me',
        success: function(res) {
            var tbody = $('#my_timetable_tbody');

            if(res.properties.term_info && res.properties.lecture_ids) {
                var term_info = JSON.parse(res.properties.term_info);
                var updated_at = res.properties.updated_at;

                console.log(Timetable.getInstance());
                var campus = Timetable.getInstance().getCampusById(term_info[0]);
                var campus_name = campus.getUnivName() + ' (' + campus.getCampusName() + ')';

                tbody.html('<tr><td>' + campus_name + '</td><td>' + updated_at + '</td>' +
                    '<td><button type="button" class="btn btn-primary btn-xs" onclick="load_my_timetable()">불러오기</button></td>' +
                    '<td><button type="button" class="btn btn-danger btn-xs" onclick="remove_my_timetable()">삭제</button></td></tr>'
                );
            } else {
                tbody.html('<tr><td colspan="4">등록된 시간표가 존재하지 않습니다</td></tr>');
            }

            $('#my_timetable_title').text('내 시간표 관리 - ' + res.properties.nickname);
            $('#my_timetable_login').hide();
            $('#my_timetable_list').show();
        },
        fail: function(error) {
            alert(JSON.stringify(error));
            login_page();
        }
    });
}

function save_my_timetable(name) {
    var data = Timetable.getInstance().saveMyTimetable(name);
    if(data.lecture_ids.length < 1) {
        alert('강의가 선택되지 않았습니다');
        return false;
    }

    var date = new Date();
    var date_text = date.getFullYear() + '.' + String("0" + (date.getMonth() + 1)).slice(-2) + '.' + String("0" + date.getDate()).slice(-2);
    date_text += ' ' + String("0" + date.getHours()).slice(-2) + ':' + String("0" + date.getMinutes()).slice(-2) + ':' + String("0" + date.getSeconds()).slice(-2);

    Kakao.API.request({
        url: '/v1/user/update_profile',
        data: {
            'properties': {
                'term_info': JSON.stringify([data.campus, data.year, data.term]),
                'lecture_ids': JSON.stringify(data.lecture_ids),
                'updated_at': date_text
            }
        },
        success: function(res) {
            my_timetable_page();
        },
        fail: function(error) {
            alert(JSON.stringify(error));
            login_page();
        }
    });

    return false;
}

function load_my_timetable() {
    Kakao.API.request({
        url: '/v1/user/me',
        success: function(res) {
            var term_info = JSON.parse(res.properties.term_info);
            var lecture_ids = JSON.parse(res.properties.lecture_ids);
            Timetable.getInstance().setHashInfo(term_info[0], term_info[1], term_info[2], lecture_ids);

            $('#my_timetable').modal('hide');
        },
        fail: function(error) {
            alert(JSON.stringify(error));
            login_page();
        }
    });
}

function remove_my_timetable() {
    Kakao.API.request({
        url: '/v1/user/update_profile',
        data: {
            'properties': {
                'term_info': null,
                'lecture_ids': null,
                'updated_at': null
            }
        },
        success: function(res) {
            my_timetable_page();
        },
        fail: function(error) {
            alert(JSON.stringify(error));
            login_page();
        }
    });
}

Kakao.init('72567a9de374e3c4c9354e9a6b78a550');

Kakao.Auth.createLoginButton({
    container: '#kakao_login_btn',
    success: function(authObj) {
        my_timetable_page();
    },
    fail: function(err) {
        alert(JSON.stringify(err));
    }
});
