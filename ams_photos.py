import requests
import os
import browser_cookie3

# Output directory
os.makedirs("ashoka_images", exist_ok=True)

# Load cookies from Chrome for the Ashoka domain
cookies = browser_cookie3.chrome(domain_name="ams.ashoka.edu.in")

students = [
    {
        "email": "aadhya.shetty_ug2025@ashoka.edu.in",
        "name": "Aadhya Rajesh Shetty",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-12399/O10-2025-12399_03082025212317253.jpg"
    },
    {
        "email": "aanya.mishra_ug2024@ashoka.edu.in",
        "name": "Aanya Mishra",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-10759/652b8851a447b846344386_82C3B9A6DBF44470BAD40355230866F9.jpeg"
    },
    {
        "email": "aarav.sanghvi_ug2024@ashoka.edu.in",
        "name": "Aarav Sanghvi",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-12027/655c7416eba76507639041_IMG_9502.JPG"
    },
    {
        "email": "aarav.khetan_ug2025@ashoka.edu.in",
        "name": "Aarav Vivek Khetan",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-17028/O10-2025-17028_02082025134516052.JPG"
    },
    {
        "email": "abhiyash.jaini_ug2023@ashoka.edu.in",
        "name": "Abhiyash Kumar Jaini",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-13655/10-2023-13655.jpg"
    },
    {
        "email": "aditi.chhajed_ug2025@ashoka.edu.in",
        "name": "Aditi Chhajed",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-19850/O10-2025-19850_05082025112532202.png"
    },
    {
        "email": "advait.sanghavi_ug2025@ashoka.edu.in",
        "name": "Advait Premal Sanghavi",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-13154/6725aa51e8dc4112460146_1071copy.JPG"
    },
    {
        "email": "advika.jajodia_ug2024@ashoka.edu.in",
        "name": "Advika Jajodia",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-10206/O10-2024-10206_01082024130606124.jpg"
    },
    {
        "email": "anya.ghosh_ug2023@ashoka.edu.in",
        "name": "Anya Ghosh",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-13751/10-2023-13751.jpeg"
    },
    {
        "email": "ananya.jain_ug2024@ashoka.edu.in",
        "name": "Ananya Jain",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-30265/O10-2024-30265_06082024155758036.jpeg"
    },
    {
        "email": "anya.jain1_ug2024@ashoka.edu.in",
        "name": "Anya Jain",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-10620/65291eb624743666517611_AnyaJain.jpeg"
    },
    {
        "email": "arjun.doshi_ug2025@ashoka.edu.in",
        "name": "Arjun Apurva Doshi",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-18284/6776494fd9421437753932_PICOFME.jpg"
    },
    {
        "email": "arnav.balyan_ug2025@ashoka.edu.in",
        "name": "Arnav Balyan",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-20305/678e777b6b1e5856846985_Arnav_Balyan_photo.jpeg"
    },
    {
        "email": "arnav.goyal_ug2023@ashoka.edu.in",
        "name": "Arnav Goyal",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-12724/10-2023-12724.jpeg"
    },
    {
        "email": "arnav.karnany_ug2023@ashoka.edu.in",
        "name": "Arnav Karnany",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-10215/10-2023-10215_26072023164839655.jpeg"
    },
    {
        "email": "avi.dhall_ug2023@ashoka.edu.in",
        "name": "Avi Dhall",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-10554/10-2023-10554.jpeg"
    },
    {
        "email": "avika.kapur_ug2024@ashoka.edu.in",
        "name": "Avika Kapur",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-10729/O10-2024-10729_19072024013531467.JPG"
    },
    {
        "email": "ayush.srivastava_ug2025@ashoka.edu.in",
        "name": "Ayush Srivastava",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-21670/O10-2025-21670_06082025005622541.jpg"
    },
    {
        "email": "devang.arora_ug2023@ashoka.edu.in",
        "name": "Devang Arora",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-21182/10-2023-21182.jpg"
    },
    {
        "email": "dhruv.lunia_ug2024@ashoka.edu.in",
        "name": "Dhruv Lunia",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-12859/O10-2024-12859_06082024192722847.JPG"
    },
    {
        "email": "garv.marodia_ug2023@ashoka.edu.in",
        "name": "Garv Marodia",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-12585/10-2023-12585.jpeg"
    },
    {
        "email": "heet.dhawale_ug2023@ashoka.edu.in",
        "name": "Heet Dhawale",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-10587/10-2023-10587_26072023123116044.JPG"
    },
    {
        "email": "hridansh.sakaria_ug2025@ashoka.edu.in",
        "name": "Hridansh Ketan Sakaria",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-11039/6728dc593bd6c936893806_hridanshpic.jpg"
    },
    {
        "email": "jyotir.sinha_ug2025@ashoka.edu.in",
        "name": "Jyotir Sinha",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-10063/670919c8e214f469539333_Jyotirsinhaphoto.jpeg"
    },
    {
        "email": "keshav.jalan_ug2024@ashoka.edu.in",
        "name": "Keshav Jalan",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-30576/66419f33da8b5722982346_4.jpg"
    },
    {
        "email": "kian.nayar_ug2025@ashoka.edu.in",
        "name": "Kian Nayar",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-11731/6710c93ca3717904105558_KIANNAYAR.jpg"
    },
    {
        "email": "krtya.sunil_ug25@ashoka.edu.in",
        "name": "Krtya Sunil",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2022-12831/10-2022-12831_14092023195700782.jpeg"
    },
    {
        "email": "kushal.khetan_ug2025@ashoka.edu.in",
        "name": "Kushal Alok Khetan",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-11369/6776c1b96b2b6113878989_passportsizefinalphoto.jpg"
    },
    {
        "email": "lakshya.sharma_ug2024@ashoka.edu.in",
        "name": "Lakshya Sharma",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-11148/652b9015656ca477397876_LakshyaSharmaPhoto.jpg"
    },
    {
        "email": "laksshha.khanna_ug2025@ashoka.edu.in",
        "name": "Laksshha Khanna",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-10784/6709267cd5c0f129135069_laksshha.jpg"
    },
    {
        "email": "mishti.satnalika_ug2024@ashoka.edu.in",
        "name": "Mishti Deepak Satnalika",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-23072/O10-2024-23072_19072024014816324.jpeg"
    },
    {
        "email": "nandini.kumbhat_ug2024@ashoka.edu.in",
        "name": "Nandini Kumbhat",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-27762/661554e50ec97198368596_NKPassportsizepic.jpg"
    },
    {
        "email": "niket.nair_ug2024@ashoka.edu.in",
        "name": "Niket Nair",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-11596/O10-2024-11596_07082024135731031.jpg"
    },
    {
        "email": "pranav.ananthasubramanyam_ug2024@ashoka.edu.in",
        "name": "Pranav Ananthasubramanyam",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-23102/65d2489b5966e417533045_PranavPassportphoto.jpg"
    },
    {
        "email": "raghav.sharma_ug2024@ashoka.edu.in",
        "name": "Raghav Sharma",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-27409/661147ad20211220318942_passportsizephoto.jpg"
    },
    {
        "email": "reva.agarwal_ug2023@ashoka.edu.in",
        "name": "Reva Agarwal",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-10668/10-2023-10668_28072023220939236.jpg"
    },
    {
        "email": "revant.mehta_ug2024@ashoka.edu.in",
        "name": "Revant Mehta",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-12337/655ce17001c56709029427_Revant_Mehta_Picture.JPG"
    },
    {
        "email": "reyanshi.kanoria_ug2023@ashoka.edu.in",
        "name": "Reyanshi Kanoria",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-24923/10-2023-24923_10082023180250373.jpg"
    },
    {
        "email": "riddhima.nagori_ug2025@ashoka.edu.in",
        "name": "Riddhima Nagori",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-20531/O10-2025-20531_08082025161252887.png"
    },
    {
        "email": "saanvi.daga_ug2025@ashoka.edu.in",
        "name": "Saanvi Daga",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-10514/67460ea319ccd360588853_585d8c795d0547549080484ffcaa48da.jpeg"
    },
    {
        "email": "sarvesh.soundararajan_ug2024@ashoka.edu.in",
        "name": "Sarvesh Soundararajan",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-14766/655b43288a1b1686224714_WhatsAppImage20231120at16.59.10.jpeg"
    },
    {
        "email": "shreevats.bindal_ug2023@ashoka.edu.in",
        "name": "Shreevats Bindal",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-12657/10-2023-12657_29072023204936070.jpeg"
    },
    {
        "email": "shriyansh.dalmia_ug2023@ashoka.edu.in",
        "name": "Shriyansh Dalmia",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-18429/10-2023-18429.jpg"
    },
    {
        "email": "srishti.singhi_ug2024@ashoka.edu.in",
        "name": "Srishti Singhi",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-20258/659e2c2e2cad2757364192_SrishtiPassportSizePhoto.jpeg"
    },
    {
        "email": "tanvee.jitendra_ug2024@ashoka.edu.in",
        "name": "Tanvee Jitendra",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-22087/O10-2024-22087_07082024161243976.jpg"
    },
    {
        "email": "tanya.mehra_ug25@ashoka.edu.in",
        "name": "Tanya Mehra",
        "url": "https://my.ashoka.edu.in/SIS/ProfileImage/PRG00000001/SES00000075/10202210066.jpg"
    },
    {
        "email": "vaibhavi.kumari_ug2025@ashoka.edu.in",
        "name": "Vaibhavi Kumari",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-10520/670820d73f5b1637916181_PassportSizedPhotograph.jpg"
    },
    {
        "email": "varnima.agarwal_ug25@ashoka.edu.in",
        "name": "Varnima Agarwal",
        "url": "https://my.ashoka.edu.in/SIS/ProfileImage/PRG00000001/SES00000075/10202216280.jpg"
    },
    {
        "email": "vedika.tandon_ug2023@ashoka.edu.in",
        "name": "Vedika Tandon",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-12327/10-2023-12327_11082023201502305.jpeg"
    },
    {
        "email": "aahan.desai_ug2025@ashoka.edu.in",
        "name": "Aahan Prashant Desai",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-15708/67470ace9615c584931594_AahanPhoto.jpeg"
    },
    {
        "email": "dersh.savla_ug2023@ashoka.edu.in",
        "name": "Dersh Vinod Savla",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-13591/10-2023-13591.jpg"
    },
    {
        "email": "mahir.shah_ug25@ashoka.edu.in",
        "name": "Mahir Parimal Shah",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2022-19511/10-2022-19511_09062025143602010.jpg"
    },
    {
        "email": "nishant.jayade_ug2023@ashoka.edu.in",
        "name": "Nishant Chetan Jayade",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-10634/10-2023-10634.JPG"
    },
    {
        "email": "pulkit.agrawal_ug2024@ashoka.edu.in",
        "name": "Pulkit Agrawal",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2024-11094/O10-2024-11094_01082024224151947.jpeg"
    },
    {
        "email": "rajit.mundhra_ug2023@ashoka.edu.in",
        "name": "Rajit Ashish Mundhra",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-10501/10-2023-10501.jpg"
    },
    {
        "email": "saloni.rego_ug2025@ashoka.edu.in",
        "name": "Saloni Elizabeth Rego",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-11745/6710d8f2bae6a554446599_SaloniElizabethRego_Photo.jpg"
    },
    {
        "email": "shourya.agarwal_ug2023@ashoka.edu.in",
        "name": "Shourya Sachin Agarwal",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/10-2023-20471/10-2023-20471.jpg"
    },
    {
        "email": "vedaant.wadhawan_ug2025@ashoka.edu.in",
        "name": "Vedaant Vishal Wadhawan",
        "url": "https://ams.ashoka.edu.in//blobHandler.ashx?url=https://ashokadocumentsstore.blob.core.windows.net/documents/O10-2025-10209/670ac42032e8c159922636_vedaantpic.png"
    }
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://ams.ashoka.edu.in/"
}

for student in students:
    name_safe = student["name"].replace(" ", "_")
    ext = student["url"].split(".")[-1].split("?")[0]
    filename = f"ashoka_images/{name_safe}.{ext}"

    print(f"Downloading: {student['name']}...")
    try:
        response = requests.get(student["url"], cookies=cookies, headers=headers, timeout=15)
        if response.status_code == 200 and "image" in response.headers.get("Content-Type", ""):
            with open(filename, "wb") as f:
                f.write(response.content)
            print(f"  ✓ Saved to {filename}")
        else:
            print(f"  ✗ Failed — Status: {response.status_code}, Content-Type: {response.headers.get('Content-Type')}")
    except Exception as e:
        print(f"  ✗ Error: {e}")

print("\nDone!")