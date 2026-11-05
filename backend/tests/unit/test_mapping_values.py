import pytest

from app.utils.mapping_values.mapping_values import convert_time_frame


class TestConvertTimeFrame:
    def test_1h_returns_1(self):
        assert convert_time_frame("1h") == 1

    def test_1d_returns_1(self):
        assert convert_time_frame("1d") == 1

    def test_1w_returns_7(self):
        assert convert_time_frame("1w") == 7

    def test_1m_returns_30(self):
        assert convert_time_frame("1m") == 30

    def test_1y_returns_365(self):
        assert convert_time_frame("1y") == 365

    def test_max_returns_string_max(self):
        assert convert_time_frame("max") == "max"

    def test_max_return_type_is_string(self):
        result = convert_time_frame("max")
        assert isinstance(result, str)

    def test_day_values_return_integers(self):
        for key in ("1h", "1d", "1w", "1m", "1y"):
            result = convert_time_frame(key)
            assert isinstance(result, int), f"{key} should return int"

    def test_invalid_key_raises_key_error(self):
        with pytest.raises(KeyError):
            convert_time_frame("invalid")

    def test_empty_string_raises_key_error(self):
        with pytest.raises(KeyError):
            convert_time_frame("")
