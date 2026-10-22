from leadminer import gmaps, linkedin
from leadminer.enrich import extract_contacts

PLACE_URL = (
    "https://www.google.com/maps/place/Acme+Soft/@30.0,31.4,17z/data=!3m1!4b1!4m6!3m5"
    "!1s0x14583d3f1b2c3d4e:0xabc123def4567890!8m2!3d30.0281!4d31.4913!16s%2Fg%2F11x?hl=en"
)


def test_parse_place_full():
    raw = {
        "name": "Acme Soft",
        "category": "Software company",
        "address": "Address: 90th St, New Cairo 1, Cairo Governorate",
        "phone_id": "phone:tel:+201001234567",
        "phone_label": "Phone: 010 01234567",
        "website": "https://acme.example/",
        "plus_code": "Plus code: 2FH8+6G New Cairo 1",
        "rating_block": "4.6\n(1,234)",
        "reviews_label": "",
    }
    lead = gmaps.parse_place(raw, PLACE_URL, "software company New Cairo")
    assert lead.name == "Acme Soft"
    assert lead.phone == "+201001234567"
    assert lead.address == "90th St, New Cairo 1, Cairo Governorate"
    assert lead.plus_code == "2FH8+6G New Cairo 1"
    assert (lead.rating, lead.reviews) == (4.6, 1234)
    assert (lead.latitude, lead.longitude) == (30.0281, 31.4913)
    assert lead.key == "gmaps:0x14583d3f1b2c3d4e:0xabc123def4567890"
    assert "?" not in lead.maps_url


def test_parse_place_missing_fields_falls_back():
    raw = {"name": "Chalet X", "phone_label": "Phone: 012 3456 7890", "reviews_label": "87 reviews", "rating_block": ""}
    lead = gmaps.parse_place(raw, "https://www.google.com/maps/place/x/@31.1,28.2,15z")
    assert lead.phone == "012 3456 7890"
    assert (lead.rating, lead.reviews) == (None, 87)
    assert (lead.latitude, lead.longitude) == (31.1, 28.2)
    assert lead.key.startswith("h:")


def test_parse_rating_arabic_digits():
    assert gmaps.parse_rating("4.2(٣٤٥)") == (4.2, 345)


def test_extract_contacts():
    html = """
    <a href="mailto:Sales@Acme.example?subject=hi">mail</a>
    <a href="https://www.facebook.com/sharer/sharer.php?u=x">share</a>
    <a href="https://www.facebook.com/acmesoft">fb</a>
    <a href="https://instagram.com/acme.soft/">ig</a>
    <a href="https://www.linkedin.com/company/acme-soft">li</a>
    <a href="https://wa.me/201001234567">wa</a>
    <img src="logo@2x.png">
    """
    found = extract_contacts(html, "https://acme.example/")
    assert found == {
        "email": "sales@acme.example",
        "facebook": "https://www.facebook.com/acmesoft",
        "instagram": "https://instagram.com/acme.soft/",
        "linkedin": "https://www.linkedin.com/company/acme-soft",
        "whatsapp": "https://wa.me/201001234567",
    }


def test_extract_contacts_ignores_asset_emails():
    assert extract_contacts('<p>icon@2x.png and x@sentry.io</p>', "https://a.b") == {}


DDG_HTML = """
<div class="result results_links results_links_deep web-result ">
  <h2 class="result__title">
    <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Feg.linkedin.com%2Fcompany%2Facme-soft%3Ftrk%3Dx&amp;rut=abc">Acme Soft | LinkedIn</a>
  </h2>
  <a class="result__snippet" href="#">Acme Soft | <b>Software</b> Development | 120 followers</a>
</div>
<div class="result">
  <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fsomeone">Someone - LinkedIn</a>
</div>
"""


def test_linkedin_parse_results_keeps_company_pages_only():
    results = linkedin.parse_results(DDG_HTML)
    assert results == [
        {
            "url": "https://eg.linkedin.com/company/acme-soft",
            "title": "Acme Soft | LinkedIn",
            "snippet": "Acme Soft | Software Development | 120 followers",
        }
    ]
    assert linkedin.company_name(results[0]["title"]) == "Acme Soft"
