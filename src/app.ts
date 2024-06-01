import axios from "axios";

const GOOGLE_API_KEY = "AIzaSyCWQyOki15om9wU-L4x_Ov5eRxd1kzvKJo";

type GoogleGeoResponse = {
  results: { geometry: { location: { lat: number; lng: number } } }[];
  status: "OK" | "ZERO_RESULTS";
};

class Input {
  formElement: HTMLFormElement;
  inputElement: HTMLInputElement;
  cityNameElement: HTMLHeadingElement;
  shrLocationButton: HTMLButtonElement;

  constructor() {
    this.formElement = document.querySelector("form")! as HTMLFormElement;
    this.inputElement = document.getElementById("address")! as HTMLInputElement;
    this.cityNameElement = document.getElementById(
      "cityName"
    )! as HTMLHeadingElement;
    this.shrLocationButton = document.querySelector(".locationBtn")!;
    this.configure();
  }

  configure() {
    this.shrLocationButton.addEventListener(
      "click",
      this.getCurrentPostion.bind(this)
    );

    this.formElement.addEventListener(
      "submit",
      this.searchAddressHandler.bind(this)
    );
  }
  successCallBack(pos: GeolocationPosition) {
    const crd = pos.coords;
    const { latitude, longitude } = crd;
    const newCord = `${latitude},${longitude}`;

    this.getWeathereData(newCord);
  }
  errorCallBack(err: GeolocationPositionError) {
    alert(`ERROR(${err.code}): ${err.message}`);
  }
  getCurrentPostion() {
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };
    navigator.geolocation.getCurrentPosition(
      this.successCallBack.bind(this),
      this.errorCallBack,
      options
    );
  }

  searchAddressHandler(event: Event) {
    event.preventDefault();
    let address = this.inputElement.value;

    axios
      .get<GoogleGeoResponse>(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(
          address
        )}&key=${GOOGLE_API_KEY}`
      )
      .then((response) => {
        if (response.data.status !== "OK") {
          throw new Error("locationError");
        }
        const coordinates = response.data.results[0].geometry.location;
        const { lat, lng } = coordinates;
        const newCord = `${lat},${lng}`;

        this.getWeathereData(newCord);
        this.inputElement.value = "";
      })
      .catch((err: Error) => {
        if (err.message === "locationError") {
          this.showToolTip("Couldn't find that place");
        } else {
          this.showToolTip("Type city name");
        }
      });
  }
  showToolTip(tooltipTextContent: string) {
    const tooltip = document.querySelector(".tooltip")! as HTMLDivElement;
    const tooltipText = document.querySelector(
      ".tooltiptext"
    ) as HTMLSpanElement;
    tooltipText.textContent = tooltipTextContent;
    tooltip.style.visibility = "visible";
    tooltipText.style.opacity = "1";
    tooltipText.style.visibility = "visible";

    setTimeout(() => {
      tooltip.style.visibility = "hidden";
      tooltipText.style.opacity = "0";
    }, 2000);
  }
  getOtherWeatherInfo(weatherObj: any) {
    const map = new Map<string, string>();
    map.set("Chance of rain:", weatherObj.day.daily_chance_of_rain + "%");
    map.set("Average humidity:", weatherObj.day.avghumidity + "%");
    map.set("Maximum wind speed:", weatherObj.day.maxwind_kph + " km/h");
    map.set("Average visibility:", weatherObj.day.avgvis_km + " km");
    return map;
  }
  dataParse(weatherObj: any) {
    return {
      imgSrc: `${weatherObj.day.condition.icon}`,
      date: weatherObj.date,
      temp: weatherObj.day.avgtemp_c,
    };
  }
  getWeathereData(cords: string) {
    axios
      .get("http://api.weatherapi.com/v1/forecast.json", {
        params: {
          key: "1e83e394c9064cd18ac130621241805",
          q: cords,
          days: 3,
        },
      })
      .then((response1) => {
        this.setCityName(response1.data.location.name);
        const weatherArray: object[] = response1.data.forecast.forecastday;

        weatherArray.forEach((weatherObj) => {
          const newObjc = this.dataParse(weatherObj);
          const otherWeatherInfo = this.getOtherWeatherInfo(weatherObj);
          new weatherModule(
            newObjc.imgSrc,
            newObjc.date,
            newObjc.temp,
            otherWeatherInfo
          );
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  setCityName(cityName: string) {
    this.cityNameElement.textContent = cityName;
  }
}

class weatherModule {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;

  constructor(
    private iconLink: string,
    private date: string,
    private temperature: number,
    private otherWeatherInfo: Map<string, string>
  ) {
    this.templateElement = document.getElementById(
      "weatherModuleTemp"
    )! as HTMLTemplateElement;
    this.hostElement = document.querySelector(
      ".sectionWraper"
    )! as HTMLDivElement;

    this.renderModule();
  }
  configureModule(importedNode: DocumentFragment) {
    const iconElement = importedNode.querySelector(
      ".icon"
    )! as HTMLImageElement;
    const dateElement = importedNode.querySelector(
      ".date"
    )! as HTMLHeadingElement;
    const temperatureElement = importedNode.querySelector(
      ".temperature"
    )! as HTMLHeadingElement;
    const ulElement = importedNode.getElementById(
      "otherInfo"
    )! as HTMLUListElement;
    iconElement.src = this.iconLink;
    dateElement.textContent = this.date;
    temperatureElement.textContent = `${this.temperature.toString()}°C`;
    this.renderLiElements(ulElement);

    return importedNode;
  }
  renderLiElements(ulElement: HTMLUListElement) {
    for (const [key, val] of this.otherWeatherInfo) {
      const newLiElement = document.createElement("li");
      const newParagraphElement = document.createElement("p");
      newParagraphElement.textContent = `${val}`;
      newLiElement.textContent = `${key} `;
      newLiElement.appendChild(newParagraphElement);
      ulElement.appendChild(newLiElement);
    }
  }
  renderModule() {
    if (this.hostElement.children.length === 3) {
      this.hostElement.innerHTML = "";
    }
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    const configuretedNode = this.configureModule(importedNode);
    this.hostElement.appendChild(configuretedNode);
  }
}

class App {
  static init() {
    new Input();
  }
}

App.init();
