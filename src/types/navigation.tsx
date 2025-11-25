export type MainStackParamList = {
  MainTabs: undefined;
  SecondScreen: undefined;
  ThirdScreen: undefined;
  FourthScreen: undefined;
  MyMenu: undefined;
  QuestionAdd: undefined;
  QuestionList: undefined;
  BlogAdd: undefined;
  BlogList: undefined;
  NoteAdd: undefined;
  NoteList: undefined;
  TopicAdd: undefined;
  TopicList: undefined;
  TopicDetail: {
    key: string;
    title: string;
    description: string;
    imageURL: any;
    startDate: number;
    updatedDate: number;
    CreatedUser: any;
  };
  TopicEdit: {
    key: string;
    title: string;
    description: string;
    imageURL: any;
    startDate: number;
    updatedDate: number;
    CreatedUser: any;
  };
  TaskMenu: undefined;
  TaskAdd: undefined;
  TaskList: undefined;
  EventAdd: undefined;
  EventList: undefined;
  PostMenu: undefined;
  PostAdd: { 
  title: string; 
  description: string; 
  category: string; 
}; 
  CategoryList: { 
  title: string; 
  description: string; 
  category: string; 
}; 
CategoryAdd: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgetPassword: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Profile: undefined;
  About: undefined;
  Settings: undefined;
};


