"""
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
"""

def get_lecture_timetable(time_info):
    # 화01-03(산학202), 목04-06(산학202)
    # 화13-16 1500-1700(법208)(b-러닝)
    # -(e-러닝)
    # 빈칸은 정보 없음 (과거 데이터 증발?)

    tags = []
    if time_info.rfind(u'(b-러닝)') != -1:
        tags.append(u'b러닝')
        time_info = time_info.replace(u'(b-러닝)', u'')

    if time_info.rfind(u'(e-러닝)') != -1:
        tags.append(u'e러닝')
        time_info = time_info.replace(u'(e-러닝)', u'')

    if time_info.rfind(u'(사회봉사)') != -1:
        tags.append(u'사회봉사')
        time_info = time_info.replace(u'(사회봉사)', u'')

    time_info = time_info.split(u',')

    time_list = []
    for time in time_info:
        time_obj = _get_timetable_obj(time.strip())
        if time_obj:
            time_list.append(time_obj)

    return time_list, tags


def _get_timetable_obj(time):
    import re
    from datetime import timedelta

    # 화13-16 1500-1700(학군단406)
    # 화01-03(산학202)
    # 수00(공A303)

    time_group = re.search(u'(월|화|수|목|금|토|일)(\d{2})(-(\d{2}))?', time)
    if not time_group:
        return None

    time_group = time_group.groups()

    place_group = re.search(u'\((\D+)(.*)\)', time)
    if place_group:
        place_group = place_group.groups()

    dt = get_week_start_datetime()
    place = place_group[0] if place_group else None
    room = place_group[1] if place_group else None
    start_time = datetime_to_timestamp(
        dt + timedelta(days=str_to_week(time_group[0])) + lesson_time(int(time_group[1])))
    end_time = datetime_to_timestamp(
        dt + timedelta(
            days=str_to_week(time_group[0])) + lesson_time(int(time_group[3] if time_group[3] else time_group[1]),
                                                           True)
    )

    result = {
        'time': {
            'start': start_time,
            'end': end_time
        }
    }

    if time_group:
        lat, lng = get_lat_lng(place)
        result.update({
            'place': {
                'name': place,
                'room': room,
                'lat': lat,
                'lng': lng
            }
        })

    return result


def str_to_week(week_str):
    if week_str == u'월':
        return 0
    if week_str == u'화':
        return 1
    if week_str == u'수':
        return 2
    if week_str == u'목':
        return 3
    if week_str == u'금':
        return 4
    if week_str == u'토':
        return 5
    if week_str == u'일':
        return 6
    return 0


def lesson_time(time, end=False):
    from datetime import timedelta

    if time == 0 and not end:
        return timedelta(hours=8)
    if time == 0 and end:
        return timedelta(hours=9)
    if 0 < time < 19:
        if not end:
            time -= 1
        time *= 30
        return timedelta(
            hours=int(time / 60) + 9,
            minutes=time % 60
        )
    if time == 19 and not end:
        return timedelta(hours=18, minutes=15)
    if (time == 19 and end) or (time == 20 and not end):
        return timedelta(hours=19)
    if (time == 20 and end) or (time == 21 and not end):
        return timedelta(hours=19, minutes=45)
    if (time == 21 and end) or (time == 22 and not end):
        return timedelta(hours=20, minutes=30)
    if (time == 22 and end) or (time == 23 and not end):
        return timedelta(hours=21, minutes=15)
    if time == 23 and end:
        return timedelta(hours=22)

    return None


def get_week_start_datetime():
    from datetime import datetime, timedelta

    dt = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    dt = dt - timedelta(days=dt.weekday())
    return dt


def datetime_to_timestamp(dt):
    return dt.weekday() * 86400 + dt.hour * 3600 + dt.minute * 60 + dt.second


def get_lat_lng(place):
    if place == u'문':
        return 37.542496, 127.078385
    elif place == u'이':
        return 37.541549, 127.080427

    elif place == u'이과':
        return 37.541549, 127.080427

    elif place == u'법':
        return 37.541691, 127.075318

    elif place == u'경영':
        return 37.544294, 127.076326

    elif place == u'동':
        return 37.540632, 127.074089

    elif place == u'산학':
        return 37.539751, 127.073113

    elif place == u'생':
        return 37.540959, 127.074545

    elif place == u'수':
        return 37.539169, 127.074701

    elif place == u'건A':
        return 37.543694, 127.078375

    elif place == u'건B':
        return 37.543694, 127.078375

    elif place == u'예':
        return 37.542916, 127.073022

    elif place == u'사':
        return 37.543992, 127.074181

    elif place == u'언어원':
        return 37.542529, 127.074637

    elif place == u'새':
        return 37.543568, 127.077435

    elif place == u'종강':
        return 37.541460, 127.075237

    elif place == u'중장비':
        return 37.542350, 127.079926

    elif place == u'상허관':
        return 37.544207, 127.075374

    elif place == u'공A':
        return 37.541643, 127.078835

    elif place == u'공B':
        return 37.541977, 127.079873

    elif place == u'공C':
        return 37.541173, 127.079345

    elif place == u'이실':
        return 37.541549, 127.080427

    elif place == u'공별':
        return 37.541601, 127.079699

    elif place == u'창':
        return 37.541148, 127.081657

    elif place == u'학군단':
        return 37.542185, 127.072661

    elif place == u'법L':
        return 37.541691, 127.075318

    elif place == u'예B':
        return 37.542916, 127.073022

    elif place == u'해봉관':
        return 37.543321, 127.078256

    return 37.542446, 127.076501