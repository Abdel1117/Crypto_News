TIME_FRAME_DAYS = {"1h": 1, "1d": 1, "1w": 7, "1m": 30, "1y": 365, "max": "max"}


def convert_time_frame(val):
    return TIME_FRAME_DAYS[val]
