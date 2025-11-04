import json

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import time
import os

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


    KA_BODY = {
  "prompt": prompt,
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
                             headers={'x-auth-token': AI_PLATFORM_API_KEY}, json=KA_BODY)
    return f"Knowledge Assistant summary for: {title}"

def send_message(data):
    testrail_template = [
        {
            "title": "Login with valid credentials",
            "priority_id": 3,
            "custom_steps_separated": [
                {"content": "Enter username", "expected": "Username accepted"},
                {"content": "Enter password", "expected": "Login successful"}
            ]
        }
    ]
    BASE_DIR = os.path.dirname(__file__)
    file_path = os.path.join(BASE_DIR, "prompt.txt")

    with open(file_path, "r", encoding="utf-8") as f:
        prompt = f.read()
    # prompt = "I am a developer that need to write Unit Tests based on an Functional Specification Document."
    # "Please generate Unit Tests as JSON for TestRail based on the below Functional Specification Document."
    # "and bases on the information in this site: https://knowledge.exlibrisgroup.com/Alma"
    # "I don't want any text in addition to the JSON array."
    # "The format of the JSON is: {0}"
    # "The Functional Specification Document: ".format(testrail_template) + data['content']

    prompt = prompt.replace("{0}", data['title'])
    prompt = prompt.replace("{1}", str(testrail_template))
    prompt = prompt.replace("{2}", data['content'])
    CONV_BODY = {
  "prompt": prompt,
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

    res = response.json()['results'][0]['completion'].replace("```json", "").replace("```", "")
    res = json.loads(res)
    print(res)
    return res


def push_tests_to_testrail(tests, title):
    # === TestRail configuration ===
    TESTRAIL_BASE = "https://testrail.pre.proquest.com/testrail/index.php?/api/v2"
    USER = "Joey.Gelpe@exlibrisgroup.com"
    API_KEY = "Newemployee123"
    PROJECT_ID = "27"

    response = requests.post(
        f"{TESTRAIL_BASE}/add_section/{PROJECT_ID}",
        auth=(USER, API_KEY),
        headers={"Content-Type": "application/json"},
        json={
            "suite_id": 32713,
            "name": title,
            "description": "Auto generated by UT Wiz :)"
        }
    )
    SECTION_ID = response.json().get("id")

    # === Loop through and add each case ===
    for case in tests:
        response = requests.post(
            f"{TESTRAIL_BASE}/add_case/{SECTION_ID}",
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


@app.post("/")
async def read_root(request: Request) :
    data = await request.json()
    tests = send_message(data)
    push_tests_to_testrail(tests, data['title'])
    return {"message": "UTs created successfully"}


# if __name__ == "__main__":
#     create_result = create_agent()
#     print(create_result)
#     get_result = get_agent()
#     print(get_result)
#     conversation_id = create_conversation()
#     add_message(conversation_id)

    # delete_conversation(conversation_id)
    # delete_agent()


    # tests = send_message()
    # push_tests_to_testrail(tests)
