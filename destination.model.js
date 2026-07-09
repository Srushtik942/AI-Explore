import mongoose from "mongoose";

const DestinationSchema = new mongoose.Schema({
  origin:{
    type: String,
    required: [true, 'Please provide an origin'],
  },
  destination : {
    type: String,
    required: [true, 'Please provide a destination'],
    trim: true
  },
  travellers:{
    adults:{
    type:Number,
    required: [true, 'Please provide number of travellers'],
    min: [1, 'Atleast 1 adult is required.']
    },
    children:{
        type: Number,
        default: 0,
        min:[0,'Children count cannot be negative'],
    }
  },
  budget:{
    min:{
    type: Number,
    required: [true, 'Please provide a budget'],
    },
    max:{
        type: Number,
        required: [true, "Please provide a maximum budget"],
        validate:{
            validator: function(value){
                return value >= this.budget.min;
            },
            message: "Maximum budget must be greater than or equal to minimum budget"
        }
    },
    currency:{
        type: String,
        default: 'USD',
    }
  },
  preference : {
    type: String
  },
  dates:{
    startDate: {
      type: Date,
      required:[true, 'Please provide a start date']
    },
    endDate: {
      type: Date,
      required:[true, 'Please provide an end date'],
      validate: {
        validator: function(value) {
          return value > this.dates.startDate;
        },
        message: 'endDate must be after startDate',
      }
    },
    durationDays:{
      type: Number
    }
  },
  contact:{
    type: String
  }
},
{
  timestamps: true
}
);

const Destination = mongoose.model('Destination', DestinationSchema);
export default Destination;