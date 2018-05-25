library(shiny)

# Display SIR model
shinyUI(pageWithSidebar(
  
  #Application title
  headerPanel("Challenge 4: Multiple model predictions"),
  
  sidebarPanel(
    # Simple integer interval
    sliderInput("t", "Day:", 
                min=0, max=100, value=0),
    
    selectInput("Model Selection", "Models:",
                list("SIR" = "SIR", 
                     "SIER" = "SIER", 
                     "SIVR" = "SIVR")),
    checkboxInput("Vaccine_1", "Vaccine 1", FALSE),
    checkboxInput("School_closure", "School closure", FALSE)
    
  ),
  
  # insert hexagon uk map
  mainPanel(
    plotOutput("hexplots")
     
  )
))