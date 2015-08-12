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
import sys
import json
import os
import asyncio
import random
from os import path
from urllib import parse

import requests
import aiohttp
from bs4 import BeautifulSoup, SoupStrainer

from .lecture_time import get_lecture_timetable
from .jsonp import jsonp

DEPARTMENT_LECTURES_WORKER_COUNT = 8
WORKER_COUNT = 8

TERM_CODE = {
    '1': 'B01011',  # 1학기
    '2': 'B01014',  # 여름학기
    '3': 'B01012',  # 2학기
    '4': 'B01015'  # 겨울학기
}

year = sys.argv[1]
term = TERM_CODE.get(sys.argv[2])
data_dir = sys.argv[3]

department_file = path.join(data_dir, 'department.json')
lecture_file = path.join(data_dir, 'lecture.json')
lecture_dir = path.join(data_dir, 'lecture')

departments = []
lectures = {}

department_lectures_qeueu = asyncio.Queue()
lecture_queue = asyncio.Queue()
loop = asyncio.get_event_loop()


class Lecture:
    LOAD_LECTURE_COUNT = 0

    def __init__(self, data):
        self.id = data[2].text
        self.type = None
        self.grade = int(data[0].text) if data[0].text else None
        self.subject_code = None
        self.subject_name = None
        self.credit = 0
        self.timetable = []
        self.tags = []
        self.professors = []
        self.links = []
        self.departments = []

        self._temp_lang = data[9].text
        self._temp_pass = data[12].text
        self._temp_msg = data[13].text

        Lecture.LOAD_LECTURE_COUNT += 1
        lecture_queue.put_nowait(self)

    @asyncio.coroutine
    def load_data(self):
        query = parse.urlencode({
            'callback': 'timetable',
            'ltYy': year,
            'ltShtm': term,
            'sbjtId': self.id,
        })

        more_data = None
        try:

            response = yield from aiohttp.request(
                method='GET',
                url='http://kupis.konkuk.ac.kr/sugang/acd/cour/time/MobileTimeTableInfoList.jsp?%s' % query,
                headers={
                    'User-Agent': 'Timetable; (+https://github.com/shlee322/timetable; Contact;)'
                }
            )

            response_data = yield from response.read()
            more_data = jsonp(response_data.decode('utf-8'))
        except Exception as e:
            print(e)
            yield from lecture_queue.put(self)
            return

        self.subject_code = more_data[0].get('haksuId')
        self.subject_name = more_data[0].get('subject')
        self.type = more_data[0].get('pobtDivNm')
        self.credit = int(more_data[0].get('pnt'))
        self.timetable, self.tags = get_lecture_timetable(more_data[0].get('time'))
        self.professors = more_data[0].get('prof').split(',')

        self.links.append({
            'name': '강의계획서',
            'url': 'http://kupis.konkuk.ac.kr/sugang/acd/cour/plan/CourLecturePlanInq.jsp?ltYy=%s&ltShtm=%s&sbjtId=%s' % (year, term, self.id)
        })
        self.links.append({
            'name': '교과해설',
            'url': 'http://kupis.konkuk.ac.kr/sugang/acd/cour/plan/CourLectureDetailInq.jsp?openYy=%s&haksuId=%s' % (year, self.subject_code)
        })
        self.links.append({
            'name': '인원검색',
            'url': 'http://kupis.konkuk.ac.kr/sugang/acd/cour/aply/CourInwonInqTime.jsp?ltYy=%s&ltShtm=%s&sbjtId=%s' % (year, term, self.id)
        })

        if self._temp_lang != '':
            self.tags.append(self._temp_lang)
        if self._temp_pass != '':
            self.tags.append('PASS')
        if self._temp_msg != '':
            self.tags.append(self._temp_msg)

        print('Konkuk Univ - Seoul Campus : lecture load_data - %d - [%s] %s' % (
            Lecture.LOAD_LECTURE_COUNT, self.id, self.subject_name))

        Lecture.LOAD_LECTURE_COUNT -= 1

    def add_department(self, department):
        self.departments.append(department)

    def to_json(self):
        return json.dumps({
            'id': self.id,
            'type': self.type,
            'grade': self.grade,
            'subject_code': self.subject_code,
            'subject_name': self.subject_name,
            'credit': self.credit,
            'timetable': self.timetable,
            'tags': self.tags,
            'professors': self.professors,
            'links': self.links,
            'departments': self.departments
        }, indent=4, sort_keys=True)


def init_dir():
    print("Konkuk Univ - Seoul Campus : init_dir")
    if not path.exists(lecture_dir):
        os.makedirs(lecture_dir)



def load_departments():
    print("Konkuk Univ - Seoul Campus : load_departments")
    res = requests.get(
        'http://kupis.konkuk.ac.kr/sugang/acd/cour/time/SeoulTimetableInfo.jsp',
        headers={
            'User-Agent': 'Timetable; (+https://github.com/shlee322/timetable; Contact;)'
        })

    soup = BeautifulSoup(res.text, "lxml", parse_only=SoupStrainer('select', attrs={'name': 'openSust'}))
    sust_list = soup.find('select', {'name': 'openSust'})

    for sust in sust_list.find_all('option'):
        if not sust['value']:
            continue
        departments.append({
            'id': sust['value'],
            'name': sust.text.strip()
        })

    open(department_file, 'w').write(json.dumps(departments, indent=4, sort_keys=True))


@asyncio.coroutine
def load_department_lectures_coroutine(department):
    response_data = None
    try:

        response = yield from aiohttp.request(
            method='POST',
            url='http://kupis.konkuk.ac.kr/sugang/acd/cour/time/SeoulTimetableInfo.jsp',
            data={
                'ltYy': year,
                'ltShtm': term,
                'openSust': department['id'],
                'pobtDiv': 'ALL'
            },
            headers={
                'User-Agent': 'Timetable; (+https://github.com/shlee322/timetable; Contact;)'
            }
        )

        response_data = yield from response.read()
    except Exception as e:
        print(e)
        yield from department_lectures_qeueu.put(department)
        return

    print("Konkuk Univ - Seoul Campus : load_lectures(department=%s)" % department)

    soup = BeautifulSoup(response_data, "lxml", parse_only=SoupStrainer('table', attrs={
        'class': 'table_bg',
        'cellpadding': '0',
        'cellspacing': '1',
        'border': '0',
        'width': '100%'
    }))

    lecture_table = soup.find('table', {
        'class': 'table_bg',
        'cellpadding': '0',
        'cellspacing': '1',
        'border': '0',
        'width': '100%'
    })

    lecture_department_index = []
    for lecture in lecture_table.find_all('tr')[1:]:
        td_list = lecture.find_all('td')
        if len(td_list) == 1:
            continue

        if td_list[2].text not in lectures:
            lectures[td_list[2].text] = Lecture(td_list)

        lectures[td_list[2].text].add_department(department['id'])

        lecture_department_index.append(td_list[2].text)


@asyncio.coroutine
def load_department_lectures_worker():
    print('Konkuk Univ - Seoul Campus : Start load_department_lectures_worker')
    while True:
        yield from asyncio.sleep(random.random()/20)
        try:
            department = department_lectures_qeueu.get_nowait()
            yield from load_department_lectures_coroutine(department)
        except asyncio.QueueEmpty:
            break

    global DEPARTMENT_LECTURES_WORKER_COUNT
    DEPARTMENT_LECTURES_WORKER_COUNT -= 1

    print('Konkuk Univ - Seoul Campus : Stop load_department_lectures_worker %d' % DEPARTMENT_LECTURES_WORKER_COUNT)


@asyncio.coroutine
def wait_load_department_lectures():
    while DEPARTMENT_LECTURES_WORKER_COUNT > 0:
        yield from asyncio.sleep(1)

    print('Konkuk Univ - Seoul Campus : end wait')


def load_department_lectures():
    for department in departments:
        department_lectures_qeueu.put_nowait(department)

    for i in range(WORKER_COUNT):
        asyncio.async(load_department_lectures_worker())

    loop.run_until_complete(wait_load_department_lectures())


@asyncio.coroutine
def lecture_worker():
    print('Konkuk Univ - Seoul Campus : Start lecture_worker')
    while Lecture.LOAD_LECTURE_COUNT > 0:
        yield from asyncio.sleep(random.random()/20)
        try:
            lecture = lecture_queue.get_nowait()
        except asyncio.QueueEmpty:
            continue
        yield from lecture.load_data()

    global WORKER_COUNT
    WORKER_COUNT -= 1

    print('Konkuk Univ - Seoul Campus : Stop lecture_worker %d' % WORKER_COUNT)


@asyncio.coroutine
def wait_load_lectures():
    while Lecture.LOAD_LECTURE_COUNT > 0 or WORKER_COUNT > 0:
        yield from asyncio.sleep(1)

    print('Konkuk Univ - Seoul Campus : end wait')


def save_lecture():
    for i in range(WORKER_COUNT):
        asyncio.async(lecture_worker())

    loop.run_until_complete(wait_load_lectures())

    print("Konkuk Univ - Seoul Campus : save_lecture")
    for lecture in lectures.values():
        open(path.join(lecture_dir, '%s.json' % lecture.id), 'w').write(lecture.to_json())

    open(lecture_file, 'w').write(json.dumps(lectures.keys(), indent=4, sort_keys=True))
