import json

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import time

app = FastAPI()

# Allow requests from your Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://<YOUR_EXTENSION_ID>"],  # or ["*"] for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Platform Configuration ---
AI_PLATFORM_URL = 'https://agai-platform-api.dev.int.proquest.com'
AI_PLATFORM_API_KEY = 'DemoToken'
UNIQUE_PREFIX = 'UTwiz'

agent_path_segment = (UNIQUE_PREFIX).lower()

conversation_id = ''


# --- Helper function to create and fetch agent details ---
def create_agent():

    AGENT_BODY = {
        "system_prompt": "You are an assistant that knows how to get current temperatures for locations",
        "name": UNIQUE_PREFIX,
        "description": "A demo agent",
        "tools": [],
        "llm": "gpt_4o_mini"
    }

    # Step 1: Create the agent
    create_response = requests.post(
        f"{AI_PLATFORM_URL}/agent-builder/agents/",
        headers={'x-auth-token': AI_PLATFORM_API_KEY},
        json=AGENT_BODY
    )

    if create_response.status_code not in (200, 201):
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {create_response.text}")

    return create_response.json()


def get_agent():

    # Step 2: Fetch agent details
    get_response = requests.get(
        f"{AI_PLATFORM_URL}/agent-builder/agents/{agent_path_segment}/",
        headers={'x-auth-token': AI_PLATFORM_API_KEY}
    )

    if get_response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent details: {get_response.text}")

    return get_response.json()


def delete_agent():
    response = requests.delete(AI_PLATFORM_URL + '/agent-builder/agents/{0}/'.format(agent_path_segment),
                               headers={'x-auth-token': AI_PLATFORM_API_KEY})
    print(response.status_code)


def create_conversation():
    CONV_BODY = {
        "agent": agent_path_segment
    }

    # make a post to /agent-builder/conversations/ with the body above to create the conversation
    response = requests.post(AI_PLATFORM_URL + '/agent-builder/conversations/',
                             headers={'x-auth-token': AI_PLATFORM_API_KEY}, json=CONV_BODY)
    print(json.dumps(response.json(), indent=2))
    return response.json().get('url').split('/')[-2]


def delete_conversation(conversation_id):
    response = requests.delete(AI_PLATFORM_URL + '/agent-builder/conversations/{0}/'.format(conversation_id),
                               headers={'x-auth-token': AI_PLATFORM_API_KEY})
    print(response.status_code)

def add_message(CONV_ID):
    CONV_BODY = {
        "message": "What is the capital city of israel?"
    }

    # make a post to /agent-builder/conversations/{conversation}/ with the body above to get the response from the agent
    response = requests.post(AI_PLATFORM_URL + '/agent-builder/conversations/{0}/'.format(CONV_ID),
                             headers={'x-auth-token': AI_PLATFORM_API_KEY}, json=CONV_BODY)
    print(json.dumps(response.json(), indent=2))


def send_message():
    hard_coded = [
        {
            "title": "Login with valid credentials",
            "priority_id": 3,
            "custom_steps_separated": [
                {"content": "Enter username", "expected": "Username accepted"},
                {"content": "Enter password", "expected": "Login successful"}
            ]
        }
    ]

    fsd_text = "Created by Hadas Granot, last updated on 22/Aug/23  3 minute read 1Introduction 1.1Story 1.2Requirements (Business, Technical, Security) 2Solution Description 2.1Browse Bibliographic Headings / Browse Authority Headings 2.2Browse Shelf Listing 2.3Nice to have 2.4Network Zone and Topology 2.5Usage Measurements 2.6Feature Flag 3Testing guidelines – Functional / Configuration / Performance / Automated 3.1Browse BIB headings 3.2Browse AUTH headings 3.3Browse shelf listing Introduction Story As a staff user I would like to have the latest browsing selections retained in order to save time by eliminating the need to manually scroll through the list each time. Requirements (Business, Technical, Security) remember the latest values selected by the user and present them when browsing through bibliographic headings, authority headings and shelf lists. Solution Description The values will be saved upon clicking on the Browse / Go buttons. Browse Bibliographic Headings / Browse Authority Headings Family - as today (according the active_registry). Not sticky. Heading type - remember the last selection per family Source code - remember the last selection per heading type Vocabulary - remember the last selection per heading type Browse Shelf Listing The values selected in the dropdowns - Call Number Level, Call Number Type, Library, Location - should be retained across sessions using the user preferences. When auto population is done - BIB - the call number type is populated. item - call number type, library, location are populated. In both cases, this functionality should be kept. i.e. not taken from the previous session. In addition, when coming from the auto population workflow, the following should be done - If no change was done to the dropdowns, the values will not be saved If a change was done to any of the dropdowns in the auto populate - all of them will be saved The CP call_number_type determines the default value that will be used for the first time for each user. Once a user selects a call number type, the CP will be ignored. Nice to have Browse bibliographic / authority headings - currently the tab goes from left to right, then to the next line. Should be changed to first go through the left column top to bottom, then to the right column top to bottom. Family → Heading type → Source code → Vocabulary → Search value Network Zone and Topology For browse bibliographic headings and browse authority headings in a member institution - remember all values as described above per IZ / NZ tab Usage Measurements NA. As the sticky values are dynamic, viewing the current values of all users provides information of minimal use. Feature Flag BROWSE_STICKY_VALUES Keep the selected values across sessions in browse bib headings, browse auth headings and browse shelf list. Nov 2023 Testing guidelines – Functional / Configuration / Performance / Automated Browse BIB headings In an institution that is working with multiple families and multiple vocabularies for names (priorities), the following selections should remain after logout / login - select family A, heading type = names, source code and vocabulary change source code change vocabulary select family B, heading type = subjects, source code and vocabulary change source code change vocabulary Browse AUTH headings In an institution that is working with multiple families and multiple vocabularies for names, the following selections should remain after logout / login select family A, heading type = names, source code and vocabulary change source code change vocabulary select family B, heading type = subjects, source code and vocabulary change source code change vocabulary Browse shelf listing Open browse shelf listing for the first time - the call number type should be the value defined in the CP call_number_type Select - Call Number Level, Call Number Type, Library, Location - he selections should remain after logout / login Auto populate from BIB, field 082 - the call number type should be Dewey. logout / login - the values should be the ones that were selected before the auto populate Auto populate from BIB, field 060 - the call number type should be National Library of Medicine. select a value from one of the other dropdowns logout / login - the values should be the ones that were selected during the auto populate Auto populate from item - the library / location should be populated from the item logout / login - the values should be the ones that were selected before the auto populate Auto populate from item - the library / location should be populated from the item select a value from one of the other dropdowns logout / login - the values should be the ones that were selected during the auto populate"
    CONV_BODY = {
  "prompt": "I am a developer that need to write Unit Tests based on an Functional Specification Document."
        "Please generate Unit Tests as JSON for TestRail based on the below Functional Specification Document."
        "I don't want any text in addition to the JSON array."
        "The format of the JSON is: {0}"
        "The Functional Specification Document: ".format(hard_coded) + fsd_text,
  "max_tokens": 10000,
  "temperature": 0.7,
  "num_results": 1,
  "streaming": False,
  "images": [],
  "image_detail": "low",
  "seed": 0,
  "response_format": {},
  "tools": [],
  "tool_choice": {},
  "top_p": -1,
  "messages": [],
  "timing_debug": False,
  "usage": False,
  "batch": False,
  "batch_file_id": "string",
  "batch_data": [
    {
      "prompt": "string",
      "images": [
        "string"
      ],
      "messages": [
        {
          "additionalProp1": {}
        }
      ]
    }
  ],
  "reasoning": "medium"
}
    response = requests.post(AI_PLATFORM_URL + '/large-language-models/gpt_4o_mini/',
                             headers={'x-auth-token': AI_PLATFORM_API_KEY}, json=CONV_BODY)

    # print(response.json())
    res = response.json()['results'][0]['completion'].replace("```json", "").replace("```", "")
    res = json.loads(res)
    print(res)
    return res


def func(res):
    # === TestRail configuration ===
    TESTRAIL_BASE = "https://testrail.pre.proquest.com/testrail"
    USER = "Joey.Gelpe@exlibrisgroup.com"
    API_KEY = "Newemployee123"
    SECTION_ID = 319541  # Example section ID

    # === Example list of test cases ===
    test_cases = [
        {
            "title": "Login with valid credentials",
            "type_id": 1,
            "priority_id": 2,
            "custom_steps_separated": [
                {"content": "Enter username", "expected": "Username accepted"},
                {"content": "Enter password", "expected": "Login successful"}
            ]
        },
        {
            "title": "Login with invalid password",
            "type_id": 1,
            "priority_id": 3,
            "custom_steps_separated": [
                {"content": "Enter username", "expected": "Username accepted"},
                {"content": "Enter wrong password", "expected": "Error message displayed"}
            ]
        }
    ]

    # === API endpoint ===
    API_URL = f"{TESTRAIL_BASE}/index.php?/api/v2/add_case/{SECTION_ID}"

    # === Loop through and add each case ===
    for case in res:
        response = requests.post(
            API_URL,
            auth=(USER, API_KEY),
            headers={"Content-Type": "application/json"},
            json=case
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Created case '{data['title']}' (ID: {data['id']})")
        else:
            print(f"❌ Failed to create '{case['title']}': {response.status_code} {response.text}")

        # Avoid hitting rate limits
        time.sleep(0.3)


@app.get("/")
def read_root():
    res = send_message()
    func(res)
    return {"message": "Hello from your Python backend!"}

@app.post("/sendFSD")
async def sendFSD(request: Request):
    data = await request.json()
    text = data.get("text", "")
    result = {"length": len(text), "uppercase": text.upper()}
    return result




# if __name__ == "__main__":
#     # create_result = create_agent()
#     # print(create_result)
#     # get_result = get_agent()
#     # print(get_result)
#     # conversation_id = create_conversation()
#     # add_message(conversation_id)

#     # delete_conversation(conversation_id)
#     # delete_agent()

#     res = send_message()
#     func(res)
