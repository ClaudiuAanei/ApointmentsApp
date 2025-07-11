import json


def open_hours_integer(start: int, end: int, interval: int):
    """Create open hours.
    Choose from 0h to 24h and interval. Interval must be in minutes"""
    start *= 60
    end *= 60

    return [(time, time + interval) for time in range(start, end, interval) if start <= end]


def open_hours_string(open_time: list):

    available_hours = []

    for val in open_time:
        start_str = (val[0] // 60, (val[0] / 60 - val[0] // 60) * 60)
        end_str = (val[1] // 60, (val[1] / 60 - val[1] // 60) * 60)

        start_hour = ('0' if val[0] < 600 else '') + str(start_str[0])
        start_minutes = str(int(start_str[1])) if int(start_str[1]) != 0 else '00'

        start_time = start_hour + ":" + start_minutes

        end_hour = ('0' if val[1] < 600 else '') + str(end_str[0])
        end_minutes = str(int(end_str[1])) if int(end_str[1]) != 0 else "00"

        end_time = end_hour + ":" + end_minutes

        available_hours.append(f"{start_time} - {end_time}")

    return available_hours


open_time = open_hours_integer(8, 17, 30)
open_hours = open_hours_string(open_time)

dictionar = dict(zip(open_hours, open_time))


with open('../website/openhours.json', mode= 'w') as file:
    json.dump(dictionar, file, indent= 4)

