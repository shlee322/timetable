/*
Copyright (C) 2015 Sanghyuck Lee <shlee322@elab.kr>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/// <reference path="./DefinitelyTyped/jquery/jquery.d.ts" />
/// <reference path="./DefinitelyTyped/bootstrap/bootstrap.d.ts" />
/// <reference path="./DefinitelyTyped/google.analytics/ga.d.ts" />

class Campus {
    private id;
    private univ_name;
    private campus_name;

    constructor(campus_info) {
        this.id = campus_info.id;
        this.univ_name = campus_info.univ_name;
        this.campus_name = campus_info.campus_name;
    }

    public getId() {
        return this.id;
    }

    public getUnivName() {
        return this.univ_name;
    }

    public getCampusName() {
        return this.campus_name;
    }
}


class Department {
    private id;
    private name;

    constructor(department_info) {
        this.id = department_info.id;
        this.name = department_info.name;
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }
}

class LectureTime {
    public place;
    public time;

    constructor(time_info) {
        this.place = time_info.place;
        this.time = time_info.time;
    }

    public getWeekdayCode() {
        return Math.floor(this.time.start / (60*60*24));
    }

    public getWeekdayString() {
        var code = this.getWeekdayCode();
        if(code==0) return '월';
        if(code==1) return '화';
        if(code==2) return '수';
        if(code==3) return '목';
        if(code==4) return '금';
        if(code==5) return '토';
        if(code==6) return '일';
        return 'err';
    }

    private static getDayTime(time) {
        var weekday = Math.floor(time / (60*60*24));
        return time - weekday*60*60*24;
    }

    private static getTimeString(time) {
        var weekday = Math.floor(time / (60*60*24));
        time = time - weekday*60*60*24;
        var hour = Math.floor(time / (60*60));
        time -= hour * 60 * 60;
        var min = Math.floor(time / 60);

        return String("0" + hour).slice(-2) + ':' + String("0" + min).slice(-2);
    }

    public getStartTimeString() {
        return LectureTime.getTimeString(this.time.start);
    }

    public getEndTimeString() {
        return LectureTime.getTimeString(this.time.end);
    }

    public getDayStartTime() {
        return LectureTime.getDayTime(this.time.start);
    }

    public getDayEndTime() {
        return LectureTime.getDayTime(this.time.end);
    }
}


class Lecture {
    private campus_id;
    private year;
    private term;
    private id;
    private credit;
    private departments;
    private grade;
    private links;
    private professors;
    private subject_code;
    private subject_name;
    private tags;
    private timetable;
    private type;
    private _loading = false;

    constructor(campus_id, year, term, lecture_id) {
        this.campus_id = campus_id;
        this.year = year;
        this.term = term;
        this.id = lecture_id;

        this.credit = 0;
        this.departments = [];
        this.grade = 0;
        this.links = [];
        this.professors = [];
        this.subject_code = "";
        this.subject_name = "";
        this.tags = [];
        this.timetable = [];
        this.type = "";
    }

    public getId() {
        return this.id;
    }

    public getType() {
        return this.type;
    }

    public getSubjectCode() {
        return this.subject_code;
    }

    public getSubjectName() {
        return this.subject_name;
    }

    public isLoad() {
        return this._loading;
    }

    public getCredit() {
        return this.credit;
    }

    public overlapTime(target) {
        for(var this_i=0; this_i<this.timetable.length; this_i++) {
            for(var target_i=0; target_i<target.timetable.length; target_i++) {
                var this_time = this.timetable[this_i];
                var target_time = target.timetable[target_i];

                if(this_time.time.start < target_time.time.end && target_time.time.start < this_time.time.end) {
                    return true;
                }
            }
        }
        return false;
    }

    public hasDepartment(depart_id) {
        for(var i=0; i<this.departments.length; i++) {
            if(this.departments[i] == depart_id) return true;
        }
        return false;
    }

    public update() {
        Timetable.getInstance().onStartLoadLecture(this);
        var lecture = this;
        $.get('data/' + this.campus_id + '/' + this.year + '/' + this.term + '/lecture/' + this.id + '.json', function(data) {
            lecture._loading = true;
            lecture.credit = data.credit;
            lecture.departments = data.departments;
            lecture.grade = data.grade;
            lecture.links = data.links;
            lecture.professors = data.professors;
            lecture.subject_code = data.subject_code;
            lecture.subject_name = data.subject_name;
            lecture.tags = data.tags;
            lecture.timetable = [];
            for(var i=0; i<data.timetable.length; i++) lecture.timetable.push(new LectureTime(data.timetable[i]));
            lecture.type = data.type;
            lecture.showResultList(false);
            Timetable.getInstance().updateShowLectures();

            Timetable.getInstance().onFinishLoadLecture(lecture);
        });
    }

    public showResultList(create) {
        var viewer = document.getElementById('search_results');
        var lectureHTML = null;

        if(create) {
            lectureHTML = document.createElement('button');
        } else {
            lectureHTML = document.getElementById('search_results_lecture_' + this.id);
        }

        if(!lectureHTML) return;

        lectureHTML.setAttribute('id', 'search_results_lecture_' + this.id);
        lectureHTML.setAttribute('class', 'list-group-item');
        lectureHTML.setAttribute('onclick', 'Timetable.getInstance().addTimetableLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseover', 'Timetable.getInstance().setSelectLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseout', 'Timetable.getInstance().setSelectLecture(null)');

        if(!this._loading) {
            lectureHTML.innerHTML = '<span class="label label-default">' + this.id + '</span> Loading...';
        } else {
            lectureHTML.innerHTML = '<span class="label label-default">' + this.id + '</span> ' + this.subject_name;
        }

        if(create) {
            viewer.appendChild(lectureHTML);
        }
    }

    public showTimetableGeneratorRequestLecture() {
        var viewer = document.getElementById('timetable_generator_request_lectures');
        var lectureHTML = document.createElement('button');
        lectureHTML.setAttribute('class', 'list-group-item');
        lectureHTML.setAttribute('onclick', 'Timetable.getInstance().removeTimetableGeneratorRequestLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseover', 'Timetable.getInstance().setSelectLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseout', 'Timetable.getInstance().setSelectLecture(null)');

        lectureHTML.innerHTML = '<span class="label label-default">' + this.id + '</span> ' + this.subject_name;
        viewer.appendChild(lectureHTML);
    }

    public showTimetable() {
        if(this.timetable.length < 1) {
            var group = document.getElementById('timetable_etc_item_group');
            var etc_item = document.createElement('span');
            etc_item.setAttribute('role', 'button');
            etc_item.setAttribute('class', 'timetable-etc-item');
            etc_item.setAttribute('style', 'border-color:#1587BD;background-color:#9FC6E7;color:#1d1d1d;');
            etc_item.setAttribute('onclick', 'Timetable.getInstance().removeTimetableLecture("' + this.id + '")');
            etc_item.setAttribute('onmouseover', 'Timetable.getInstance().getLecture("' + this.id + '").showInfo()');

            etc_item.innerHTML = this.subject_name + ' (' + this.id + ')';
            group.appendChild(etc_item);
        } else {
            for(var i=0; i<this.timetable.length; i++) {
                var time = this.timetable[i];
                var group = document.getElementById('timetable_time_item_group_' + time.getWeekdayCode());
                if(!group) continue;

                var margin_top = (time.getDayStartTime() - 60*60*24)/60;
                var height = (time.getDayEndTime() - time.getDayStartTime())/60;

                var time_item = document.createElement('div');
                time_item.setAttribute('role', 'button');
                time_item.setAttribute('class', 'timetable-time-item');
                time_item.setAttribute('style', 'margin-top:' + margin_top + 'px; height:' + height + 'px; border-color:#1587BD;background-color:#9FC6E7;color:#1d1d1d;');
                time_item.setAttribute('onclick', 'Timetable.getInstance().removeTimetableLecture("' + this.id + '")');
                time_item.setAttribute('onmouseover', 'Timetable.getInstance().getLecture("' + this.id + '").showInfo()');

                var html = '<p><span class="timetable-time-item-subject">' + this.subject_name + '</span>';
                html += '<span> ' + this.id + '</span></p>';
                html += '<p><span>' + this.professors.join(',') + ' </span>';
                if(time.place) {
                    html += '<span>' + time.place.name + time.place.room + '</span>';
                }
                html += '</p>';
                time_item.innerHTML = html;
                group.appendChild(time_item);
            }
        }
    }

    public showInfo() {
        document.getElementById('lecture_info').removeAttribute('style');
        document.getElementById('lecture_info_subject_name').innerHTML = this.subject_name;
        document.getElementById('lecture_info_id').innerHTML = this.id;
        document.getElementById('lecture_info_professors').innerHTML = this.professors.join(',');
        document.getElementById('lecture_info_departments').innerHTML = Timetable.getInstance().getDepartmentNames(this.departments).join(',');

        var timetable = document.getElementById('lecture_info_timetable');
        timetable.innerHTML = '';
        function create_time(time_info) {
            var time = document.createElement('div');
            time.setAttribute('class', 'lecture-info-timetable-data');
            if(time_info.time) {
                time.innerHTML = '<p>' + time_info.getWeekdayString() + '요일 ' + time_info.getStartTimeString() + '~' + time_info.getEndTimeString() +'</p>';
            }
            if(time_info.place) {
                time.innerHTML += '<p>' + time_info.place.name + ' ' + time_info.place.room + '</p>';
            }
            timetable.appendChild(time);
        }

        for(var i=0; i<this.timetable.length; i++) {
            create_time(this.timetable[i]);
        }

        var tags = document.getElementById('lecture_info_tags');
        tags.innerHTML = '';
        function create_tag(name) {
            var tag = document.createElement('span');
            tag.setAttribute('class', 'label label-default lecture-info-tag');
            tag.innerHTML = name;
            tags.appendChild(tag);
        }

        create_tag(this.type);
        create_tag(this.credit + '학점');
        if(this.grade) {
            create_tag(this.grade + '학년');
        }
        for(var i=0; i<this.tags.length; i++) {
            create_tag(this.tags[i]);
        }

        var links = document.getElementById('lecture_info_links');
        links.innerHTML = '';
        function create_link(name, url) {
            var link = document.createElement('li');
            link.innerHTML = '<a href="' + url + '" target="_bleak">' + name + '</a></li>';
            links.appendChild(link);
        }

        for(var i=0; i<this.links.length; i++) {
            create_link(this.links[i].name, this.links[i].url);
        }
    }
}



class Timetable {
    private static _instance:Timetable = new Timetable();

    public static getInstance():Timetable
    {
        return Timetable._instance;
    }

    private _campus = [];
    private _year = [];
    private _department = [];
    private _lectures = {};

    private _hashinfo = {
        'campus': null,
        'year': null,
        'term': null,
        'lectures': []
    };

    private _selectLecture:Lecture = null;
    private _timetableLectures = [];

    private _currentCampus = null;
    private _currentYear = null;
    private _currentTerm = null;

    private _timetableGeneratorState = false;
    private _timetableGeneratorRequestLectures = [];
    private _timetableGeneratorTimetableList = [];
    private _timetableGeneratorTimetableIndex = 0;

    constructor() {
    }

    public init(): void
    {
        var hash_split = window.location.hash.split('/');
        if(hash_split.length > 4 && !isNaN(Number(hash_split[2])) && !isNaN(Number(hash_split[3])) && hash_split[4] != '') {
            this._hashinfo.campus = hash_split[1];
            this._hashinfo.year = Number(hash_split[2]);
            this._hashinfo.term = Number(hash_split[3]);
            this._hashinfo.lectures = hash_split[4].split(',');
        }

        $.get('data/campus.json', function(data) {
            if(data.length < 1) {
                alert('캠퍼스 데이터 로드에 실패하였습니다.');
                return;
            }

            for(var i=0; i<data.length; i++) {
                Timetable.getInstance().addCampus(data[i]);
            }
            Timetable.getInstance().updateCampusListHTML();
            if(Timetable.getInstance()._hashinfo.campus) {
                Timetable.getInstance().setCurrentCampus(Timetable.getInstance()._hashinfo.campus);
                Timetable.getInstance()._hashinfo.campus = null;
            } else {
                Timetable.getInstance()._hashinfo.year = null;
                Timetable.getInstance()._hashinfo.term = null;
                Timetable.getInstance().setCurrentCampus(data[0].id);
            }
        })
    }

    public addCampus(campus_info) {
        this._campus.push(new Campus(campus_info));
    }

    public updateCampusListHTML() {
        var viewer = document.getElementById('campus_list');
        viewer.innerHTML = '';

        for(var i=0; i<this._campus.length; i++) {
            var campus = this._campus[i];

            var campusHTML = document.createElement('button');
            campusHTML.setAttribute('type', 'button');
            campusHTML.setAttribute('class', 'list-group-item');
            campusHTML.setAttribute('onclick', 'Timetable.getInstance().setCurrentCampus("' + campus.getId() + '")');
            campusHTML.innerHTML = campus.getUnivName() + ' (' + campus.getCampusName() + ')';
            viewer.appendChild(campusHTML);
        }
    }

    public getCampusById(campus_id) {
        for(var i=0; i<this._campus.length; i++) {
            if(this._campus[i].id == campus_id) return this._campus[i];
        }
        return null;
    }

    public getCurrentCampus():Campus {
        return this._currentCampus;
    }

    public setCurrentCampus(campus_id) {
        var campus = this.getCampusById(campus_id);

        document.getElementById('campus_name').innerHTML = campus.getUnivName() + ' (' + campus.getCampusName() + ')';
        $('#select_campus').modal('hide');

        this._currentCampus = campus;
        this._year = [];
        this._department = [];
        this._lectures = {};
        this._timetableLectures = [];

        if(!this._hashinfo.year) {
            $.get('data/' + this.getCurrentCampus().getId() + '/default.json', function (data) {
                Timetable.getInstance().setCurrentTerm(data.year, data.term);
                Timetable.getInstance().updateTermHTML(data.year);
            });
        } else {
            var year = this._hashinfo.year;
            var term = this._hashinfo.term;
            this._hashinfo.year = null;
            Timetable.getInstance().setCurrentTerm(year, term);
            Timetable.getInstance().updateTermHTML(year);
        }
    }

    public setCurrentTerm(year, term) {
        this._department = [];
        this._lectures = {};
        this._timetableLectures = [];
        this._currentYear = year;
        this._currentTerm = term;

        ga('send', 'event', {
            'category': this.getCurrentCampus().getId(),
            'action': 'setCurrentTerm',
            'label': year + '/' + term
        });

        $.get('data/' + this.getCurrentCampus().getId() + '/' + year + '/term.json', function(data) {
            for(var i=0; i<data.length; i++) {
                if(data[i].id == term) {
                    document.getElementById('term_name').innerHTML = year + ' 년 ' + data[i].name + '학기';
                    return;
                }
            }
        });

        $("#lecture_loading_state").text('');
        $("#lecture_loading_div").show();

        var timetable = this;

        $.get('data/' + this.getCurrentCampus().getId() + '/' + year + '/' + term + '/lecture.json', function(data) {
            for(var i=0; i<data.length; i++) {
                var lecture_id = data[i];

                if(!timetable._lectures[lecture_id]) {
                    timetable._lectures[lecture_id] = new Lecture(timetable.getCurrentCampus().getId(), year, term, lecture_id);
                    timetable._lectures[lecture_id].update();
                }
            }
        });
    }

    public onStartLoadLecture(lecture) {
    }

    public onFinishLoadLecture(lecture) {
        var loadCount = 0;
        var allCount = 0;
        for(var name in this._lectures) {
            if(this._lectures[name].isLoad()) loadCount += 1;
            allCount += 1;
        }

        $("#lecture_loading_state").text(loadCount + '/' + allCount);

        if(loadCount == allCount) {
            this.onFinishLoadLectures();
        }
    }

    public onFinishLoadLectures() {
        if(this._hashinfo.lectures.length > 0) {
            for(var i=0; i<this._hashinfo.lectures.length; i++) {
                var lecture_id = this._hashinfo.lectures[i];
                if(this._lectures[lecture_id]) {
                    this._timetableLectures.push(this._lectures[lecture_id]);
                }
            }

            this._hashinfo.lectures = [];
        }

        $.get('data/' + this.getCurrentCampus().getId() + '/' + this._currentYear + '/' + this._currentTerm + '/department.json', function(data) {
            for(var i=0; i<data.length; i++) {
                Timetable.getInstance().addDepartment(data[i]);
            }

            Timetable.getInstance().updateDepartmentListHTML();
            Timetable.getInstance().selectDepartment(data[0].id);
            $("#lecture_loading_div").hide();
        });
    }

    public updateTermHTML(year) {
        (<HTMLInputElement>document.getElementById('input_year')).value = year;

        var input_term = document.getElementById('input_term');
        input_term.innerHTML = '<option>Loading...</option>';

        $.get('data/' + this.getCurrentCampus().getId() + '/' + year + '/term.json', function(data) {
            input_term.innerHTML = '';
            for(var i=0; i<data.length; i++) {
                var term = document.createElement('option');
                term.setAttribute('value', data[i].id);
                term.innerHTML = data[i].name;
                input_term.appendChild(term);
            }
        });
    }

    public addDepartment(depart_info) {
        this._department.push(new Department(depart_info));
    }

    public updateDepartmentListHTML() {
        var viewer = document.getElementById('department_list');
        viewer.innerHTML = '';

        for(var i=0; i<this._department.length; i++) {
            var department = this._department[i];

            var departmentHTML = document.createElement('option');
            departmentHTML.setAttribute('value', department.getId());
            departmentHTML.innerHTML = department.getName();
            viewer.appendChild(departmentHTML);
        }
    }

    public selectDepartment(depart_id) {
        if($('#search_text').val() != '') $('#search_text').val('');

        var viewer = document.getElementById('search_results');
        viewer.innerHTML = '';

        for(var name in this._lectures) {
            if(this._lectures[name].hasDepartment(depart_id)) {
                Timetable.getInstance().showLectureList(this._lectures[name].getId());
            }
        }

        ga('send', 'event', {
            'category': this.getCurrentCampus().getId(),
            'action': 'selectDepartment',
            'label': this._currentYear + '/' + this._currentTerm + '/' + depart_id
        });
    }

    public changeSearchText() {
        var query = $('#search_text').val();
        var depart_id = $('#department_list').val();

        if(query == '') {
            this.selectDepartment(depart_id);
            return;
        }

        var viewer = document.getElementById('search_results');
        viewer.innerHTML = '';

        // 과목코드 일치
        if(this._lectures[query]) Timetable.getInstance().showLectureList(this._lectures[query].getId());

        // 과목 구분 입력 (선택한 전공 내에서만 나옴)
        for(var name in this._lectures) {
            var lecture = this._lectures[name];
            if(lecture.hasDepartment(depart_id) && lecture.getType() == query) {
                Timetable.getInstance().showLectureList(lecture.getId());
            }
        }

        // 과목 명 검색 (선택한 전공 우선 순위)
        for(var name in this._lectures) {
            var lecture = this._lectures[name];
            if(lecture.hasDepartment(depart_id) && lecture.getSubjectName().indexOf(query) === 0) {
                Timetable.getInstance().showLectureList(lecture.getId());
            }
        }
        for(var name in this._lectures) {
            var lecture = this._lectures[name];
            if(!lecture.hasDepartment(depart_id) && lecture.getSubjectName().indexOf(query) === 0) {
                Timetable.getInstance().showLectureList(lecture.getId());
            }
        }

        // 과목명 코드 (이수번호) 검색
        for(var name in this._lectures) {
            var lecture = this._lectures[name];
            if(lecture.getSubjectCode() == query) {
                Timetable.getInstance().showLectureList(lecture.getId());
            }
        }
    }

    public getDepartmentNames(depart_ids) {
        var names = [];
        for(var i=0; i<this._department.length; i++) {
            for(var id_i=0; id_i<depart_ids.length; id_i++) {
                if(this._department[i].getId() == depart_ids[i]) {
                    names.push(this._department[i].getName());
                }
            }
        }
        return names;
    }

    public showLectureList(lecture_id) {
        if(!this._lectures[lecture_id]) {
            this._lectures[lecture_id] = new Lecture(this.getCurrentCampus().getId(), this._currentYear, this._currentTerm, lecture_id);
            this._lectures[lecture_id].update();
        }
        this._lectures[lecture_id].showResultList(true);
    }

    public getLecture(lecture_id):Lecture {
        return this._lectures[lecture_id];
    }

    public setSelectLecture(lecture_id) {
        var lecture = this.getLecture(lecture_id);
        this._selectLecture = lecture;

        if(lecture) {
            lecture.showInfo();
        }

        this.updateShowLectures();
    }

    public addTimetableLecture(lecture_id) {
        var lecture = this.getLecture(lecture_id);
        if(lecture == null) return;

        if(this._timetableGeneratorState) {
            this.addTimetableGeneratorRequestLecture(lecture);
            return;
        }

        for(var i=0; i<this._timetableLectures.length; i++) {
            if(this._timetableLectures[i].getSubjectCode() == lecture.getSubjectCode()) {
                alert('동일한 과목 코드가 이미 존재합니다. - ' + this._timetableLectures[i].getSubjectName() + ' (' + this._timetableLectures[i].getSubjectCode() + ')');
                return;
            }
            if(this._timetableLectures[i].overlapTime(lecture)) {
                alert('시간이 중복됩니다. - ' + this._timetableLectures[i].getSubjectName() + ' (' + this._timetableLectures[i].getSubjectCode() + ')');
                return;
            }
        }

        this._timetableLectures.push(lecture);

        this.updateShowLectures();

        ga('send', 'event', {
            'category': this.getCurrentCampus().getId(),
            'action': 'addTimetableLecture',
            'label': this._currentYear + '/' + this._currentTerm + '/' + lecture_id
        });
    }

    public removeTimetableLecture(lecture_id) {
        for(var i=0; i<this._timetableLectures.length; i++) {
            var lecture = this._timetableLectures[i];
            if(lecture.getId() == lecture_id) {
                this._timetableLectures.splice(i, 1);
                if(lecture == this._selectLecture) this._selectLecture = null;
                this.updateShowLectures();
                return;
            }
        }
    }

    public updateShowLectures() {
        for(var i=0; i<7; i++) document.getElementById('timetable_time_item_group_' + i).innerHTML='';
        document.getElementById('timetable_etc_item_group').innerHTML='';

        var select_lecture = this._selectLecture;

        var lecture_ids = [];

        for(var i=0; i<this._timetableLectures.length; i++) {
            this._timetableLectures[i].showTimetable();
            if(select_lecture == this._timetableLectures[i]) select_lecture = null;
            lecture_ids.push(this._timetableLectures[i].getId());
        }

        if(select_lecture) {
            select_lecture.showTimetable();
        }

        window.location.hash = '#/' + this.getCurrentCampus().getId() + '/' + this._currentYear + '/' + this._currentTerm + '/' + lecture_ids.join(',');
    }

    public setTimetableGeneratorState(state) {
        this._timetableGeneratorState = state;
    }

    public addTimetableGeneratorRequestLecture(lecture) {
        if(!lecture.isLoad()) return;

        for(var i=0; i<this._timetableGeneratorRequestLectures.length; i++) {
            var lecture2 = this._timetableGeneratorRequestLectures[i];
            if(lecture.getId() == lecture2.getId()) {
                alert('해당 수업이 이미 생성기에 넣어져 있습니다.');
                return;
            }
        }

        this._timetableGeneratorRequestLectures.push(lecture);
        this.updateTimetableGenerator();
    }

    public removeTimetableGeneratorRequestLecture(lecture_id) {
        for(var i=0; i<this._timetableGeneratorRequestLectures.length; i++) {
            var lecture = this._timetableGeneratorRequestLectures[i];
            if(lecture.getId() == lecture_id) {
                this._timetableGeneratorRequestLectures.splice(i, 1);
                if(lecture == this._selectLecture) this._selectLecture = null;
                this.updateShowLectures();
                this.updateTimetableGenerator();
                return;
            }
        }
    }

    public updateTimetableGenerator() {
        document.getElementById('timetable_generator_request_lectures').innerHTML='';

        for(var i=0; i<this._timetableGeneratorRequestLectures.length; i++) {
            this._timetableGeneratorRequestLectures[i].showTimetableGeneratorRequestLecture();
        }

        var html = (this._timetableGeneratorTimetableIndex+1) + '/' + this._timetableGeneratorTimetableList.length;
        if(this._timetableGeneratorTimetableList.length == 0) html = '0/0';

        document.getElementById('timetable_generator_index_viewer').innerHTML=html;
    }

    public generateTimetable() {
        var min_credit_text = (<HTMLInputElement>document.getElementById('timetable_generator_min_credit')).value;
        var max_credit_text = (<HTMLInputElement>document.getElementById('timetable_generator_max_credit')).value;

        var min_credit = 17;
        var max_credit = 21;

        if(min_credit_text != '') min_credit = Number(min_credit_text);
        if(max_credit_text != '') max_credit = Number(max_credit_text);

        if(isNaN(min_credit)) {
            alert('최소 학점이 잘못되었습니다');
            return;
        }

        if(isNaN(max_credit)) {
            alert('최대 학점이 잘못되었습니다');
            return;
        }

        if(min_credit < 1) {
            alert('최소 학점은 1보다 작을 수 없습니다');
            return;
        }

        if(max_credit < min_credit) {
            alert('최대 학점은 최소학점보다 작을 수 없습니다');
            return;
        }

        var subject_list = [];

        for(var lecture_i=0; lecture_i<this._timetableGeneratorRequestLectures.length; lecture_i++) {
            var lecture = this._timetableGeneratorRequestLectures[lecture_i];

            var mask = true;

            for(var list_i=0; list_i<subject_list.length&&mask; list_i++) {
                if(subject_list[list_i][0].getSubjectCode() == lecture.getSubjectCode()) {
                    subject_list[list_i].push(lecture);
                    mask = false;
                }
            }

            if(mask) {
                subject_list.push([lecture]);
            }
        }

        var tempTimetableList = [];

        // 부분 집합 생성
        function gen_subset(arr, index, necessary_count) {
            var subject = subject_list[index];

            for(var i=0; i<subject.length; i++) {
                var subset = arr.slice(0);
                subset.push(subject[i]);

                if(necessary_count > 1) {
                    for(var next=index+1; next<subject_list.length; next++) {
                        gen_subset(subset, next, necessary_count - 1);
                    }
                } else {
                    tempTimetableList.push(subset);
                }
            }
        }

        //lecture_count 개의 lecutre를 가지고 있는 집합을 생성
        for(var lecture_count=subject_list.length; lecture_count>0; lecture_count--) {
            for(var start_index=0; start_index<=subject_list.length-lecture_count; start_index++) {
                gen_subset([], start_index, lecture_count);
            }
        }

        this._timetableGeneratorTimetableList = [];

        var timetable = this;
        // 해당 조합이 조건에 맞는 시간표이면 추가
        function saveTimetable(lectures) {
            // 전체 학점 계산
            var credit_sum = 0;
            for(var lecture_i=0; lecture_i<lectures.length; lecture_i++) credit_sum += lectures[lecture_i].getCredit();
            if(min_credit > credit_sum) return;
            if(max_credit < credit_sum) return;

            //시간표 겹치는지 체크
            for(var lecture1_i=0; lecture1_i<lectures.length; lecture1_i++) {
                for(var lecture2_i=lecture1_i+1; lecture2_i<lectures.length; lecture2_i++) {
                    if(lectures[lecture1_i].overlapTime(lectures[lecture2_i])) return;
                }
            }

            timetable._timetableGeneratorTimetableList.push(lectures);
        }

        // 생성된 조합을 보면서 조건에 해당하지 않는 시간표를 제외하고 가능한 시간표만 포함
        for(var i=0; i<tempTimetableList.length; i++) {
            saveTimetable(tempTimetableList[i]);
        }

        this._timetableGeneratorTimetableIndex = 0;
        this.setTimetableGeneratorTimetableIndex(0);
        this.updateTimetableGenerator();
    }

    public setTimetableGeneratorTimetableIndex(index) {
        if(this._timetableGeneratorTimetableList.length <= index) {
            alert('해당 시간표를 표시할 수 없거나 생성된 시간표가 존재하지 않습니다');
            return;
        }

        this._timetableGeneratorTimetableIndex = index;
        this._timetableLectures = this._timetableGeneratorTimetableList[index];

        this.updateTimetableGenerator();
        this.updateShowLectures();
    }

    public previousTimetableGeneratorTimetable() {
        this.setTimetableGeneratorTimetableIndex(this._timetableGeneratorTimetableIndex - 1);
    }

    public nextTimetableGeneratorTimetable() {
        this.setTimetableGeneratorTimetableIndex(this._timetableGeneratorTimetableIndex + 1);
    }

    public saveMyTimetable(name) {
        var lecture_ids = [];

        for(var i=0; i<this._timetableLectures.length; i++) {
            lecture_ids.push(this._timetableLectures[i].getId());
        }

        return {
            'name': name,
            'campus': this.getCurrentCampus().getId(),
            'campus_text': document.getElementById('campus_name').innerHTML,
            'year': this._currentYear,
            'term': this._currentTerm,
            'term_text': document.getElementById('term_name').innerHTML,
            'lecture_ids': lecture_ids
        }
    }

    public setHashInfo(campus, year, term, lecture_ids) {
        this._hashinfo.campus = null;
        this._hashinfo.year = year;
        this._hashinfo.term = term;
        this._hashinfo.lectures = lecture_ids;
        this.setCurrentCampus(campus);
    }
}
