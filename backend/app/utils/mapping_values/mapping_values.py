def convert_Time_Frame(val):

    dict = {"1d": 1, "1w": 7, "1m": 30, "1y": 365, "max": "max"}

    return dict[val]
